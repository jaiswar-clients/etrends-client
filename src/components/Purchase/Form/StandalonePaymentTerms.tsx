"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { File, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import DatePicker from "@/components/ui/datepicker"
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFileUpload } from "@/hooks/useFileUpload"
import { cn, formatCurrency } from "@/lib/utils"
import { formatPaymentStatus, PAYMENT_STATUS_ENUM } from "@/types/order"

/** Payment term of a standalone license / customization (same shape as order terms). */
export interface IStandaloneTermInput {
  name: string
  percentage_from_base_cost: number
  calculated_amount: number
  status: PAYMENT_STATUS_ENUM
  invoice_number?: string
  invoice_date?: Date
  invoice_document?: string
  payment_receive_date?: Date
}

const STATUS_DOT: Record<string, string> = {
  [PAYMENT_STATUS_ENUM.PAID]: "bg-green-500",
  [PAYMENT_STATUS_ENUM.INVOICE]: "bg-blue-500",
  [PAYMENT_STATUS_ENUM.PROFORMA]: "bg-yellow-500",
  [PAYMENT_STATUS_ENUM.TO_BE_CREATED]: "bg-red-500",
}

const toDate = (v: unknown): Date | undefined => {
  if (!v) return undefined
  const d = new Date(v as string)
  return isNaN(d.getTime()) ? undefined : d
}

/**
 * Form defaults: the item's saved terms, or (for items saved before payment
 * terms existed) one 100% term built from its single invoice / status fields.
 */
export const termsFromItem = (
  item: { payment_terms?: Partial<IStandaloneTermInput>[]; payment_status?: PAYMENT_STATUS_ENUM; invoice_number?: string; invoice_date?: Date | string; invoice_document?: string; payment_receive_date?: Date | string } | undefined,
  baseAmount: number,
): IStandaloneTermInput[] => {
  if (item?.payment_terms?.length) {
    return item.payment_terms.map((t) => ({
      name: t.name || "",
      percentage_from_base_cost: Number(t.percentage_from_base_cost) || 0,
      calculated_amount: Number(t.calculated_amount) || 0,
      status: (t.status as PAYMENT_STATUS_ENUM) || PAYMENT_STATUS_ENUM.TO_BE_CREATED,
      invoice_number: t.invoice_number || "",
      invoice_date: toDate(t.invoice_date),
      invoice_document: t.invoice_document || "",
      payment_receive_date: toDate(t.payment_receive_date),
    }))
  }
  return [
    {
      name: "Full Payment",
      percentage_from_base_cost: 100,
      calculated_amount: baseAmount,
      status: item?.payment_status || PAYMENT_STATUS_ENUM.TO_BE_CREATED,
      invoice_number: item?.invoice_number || "",
      invoice_date: toDate(item?.invoice_date),
      invoice_document: item?.invoice_document || "",
      payment_receive_date: toDate(item?.payment_receive_date),
    },
  ]
}

/** Returns an error message, or null when the terms are valid. */
export const validateStandaloneTerms = (terms: IStandaloneTermInput[] | undefined): string | null => {
  if (!terms?.length) return "Add at least one payment term"
  const total = terms.reduce((s, t) => s + (Number(t.percentage_from_base_cost) || 0), 0)
  if (Math.abs(total - 100) > 0.01) return `Payment terms must add up to 100% (currently ${total.toFixed(2)}%)`
  for (const [i, t] of terms.entries()) {
    const label = t.name || `Term ${i + 1}`
    const invoiced = t.status === PAYMENT_STATUS_ENUM.INVOICE || t.status === PAYMENT_STATUS_ENUM.PAID
    if (invoiced && (!t.invoice_number || !t.invoice_date)) return `${label}: Invoice Number and Invoice Date are required for ${formatPaymentStatus(t.status)}`
    if (t.status === PAYMENT_STATUS_ENUM.PAID && !t.payment_receive_date) return `${label}: Payment Receive Date is required when Paid`
  }
  return null
}

/** Clean numbers before sending to the API. */
export const normalizeTermsForApi = (terms: IStandaloneTermInput[], baseAmount: number) =>
  terms.map((t) => {
    const pct = Number(t.percentage_from_base_cost) || 0
    return {
      ...t,
      name: t.name || "",
      percentage_from_base_cost: pct,
      calculated_amount: Number(t.calculated_amount) || (baseAmount * pct) / 100,
      invoice_number: t.invoice_number || undefined,
      invoice_document: t.invoice_document || undefined,
    }
  })

interface IProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  baseAmount: number
  disabled: boolean
  onInvoiceNumberChange?: (value: string) => void
}

/** "Payment Terms" section for license / customization forms (field: payment_terms). */
const StandalonePaymentTerms: React.FC<IProps> = ({ form, baseAmount, disabled, onInvoiceNumberChange }) => {
  const { uploadFile, getFileUrl, getFileNameFromUrl } = useFileUpload()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "payment_terms" })
  const terms: IStandaloneTermInput[] = form.watch("payment_terms") || []
  const totalPct = terms.reduce((s, t) => s + (Number(t.percentage_from_base_cost) || 0), 0)
  const totalAmount = terms.reduce((s, t) => s + (Number(t.calculated_amount) || 0), 0)

  // Keep amounts in step with the item cost
  useEffect(() => {
    const current: IStandaloneTermInput[] = form.getValues("payment_terms") || []
    current.forEach((t, i) => {
      const amount = (baseAmount * (Number(t.percentage_from_base_cost) || 0)) / 100
      if (Math.abs((Number(t.calculated_amount) || 0) - amount) > 0.005) {
        form.setValue(`payment_terms.${i}.calculated_amount`, amount)
      }
    })
  }, [baseAmount, form])

  const setPercentage = (i: number, value: string) => {
    const pct = parseFloat(value) || 0
    form.setValue(`payment_terms.${i}.percentage_from_base_cost`, pct)
    form.setValue(`payment_terms.${i}.calculated_amount`, (baseAmount * pct) / 100)
  }

  const setAmount = (i: number, value: string) => {
    const amount = parseFloat(value) || 0
    form.setValue(`payment_terms.${i}.calculated_amount`, amount)
    form.setValue(`payment_terms.${i}.percentage_from_base_cost`, baseAmount ? parseFloat(((amount / baseAmount) * 100).toFixed(2)) : 0)
  }

  const addTerm = () => {
    const remaining = Math.max(0, 100 - totalPct)
    append({
      name: `Term ${fields.length + 1}`,
      percentage_from_base_cost: remaining,
      calculated_amount: (baseAmount * remaining) / 100,
      status: PAYMENT_STATUS_ENUM.TO_BE_CREATED,
      invoice_number: "",
      invoice_document: "",
    })
  }

  return (
    <div className="space-y-4">
      {fields.map((field, i) => (
        <div key={field.id} className="relative rounded-md border border-gray-200 bg-white p-4">
          {!disabled && fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-3 top-3 text-gray-400 hover:text-red-600"
              aria-label={`Remove term ${i + 1}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name={`payment_terms.${i}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-500">Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} disabled={disabled} className="bg-white" placeholder="e.g. Advance" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`payment_terms.${i}.percentage_from_base_cost`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-500">Percentage of Cost</FormLabel>
                  <FormControl>
                    <Input type="number" value={field.value ?? ""} onChange={(e) => setPercentage(i, e.target.value)} disabled={disabled} className="bg-white" placeholder="%" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`payment_terms.${i}.calculated_amount`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-500">Amount</FormLabel>
                  <FormControl>
                    <Input type="number" value={field.value ?? ""} onChange={(e) => setAmount(i, e.target.value)} disabled={disabled} className="bg-white" placeholder="Amount" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`payment_terms.${i}.status`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-500">Payment Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full bg-white" disabled={disabled}>
                        <SelectValue
                          placeholder={
                            <div className="flex items-center">
                              <div className={cn("mr-2 h-2 w-2 rounded-full", STATUS_DOT[field.value || PAYMENT_STATUS_ENUM.TO_BE_CREATED])} />
                              <span>{formatPaymentStatus(field.value || PAYMENT_STATUS_ENUM.TO_BE_CREATED)}</span>
                            </div>
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {Object.values(PAYMENT_STATUS_ENUM).map((value) => (
                          <SelectItem value={value} key={value}>
                            <div className="flex items-center">
                              <div className={cn("mr-2 h-2 w-2 rounded-full", STATUS_DOT[value])} />
                              <span>{formatPaymentStatus(value)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`payment_terms.${i}.invoice_number`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-500">Invoice Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e)
                        onInvoiceNumberChange?.(e.target.value)
                      }}
                      disabled={disabled}
                      className="bg-white"
                      placeholder="Enter invoice number"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`payment_terms.${i}.invoice_date`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-500">Invoice Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} onDateChange={field.onChange} disabled={disabled} placeholder="Pick a Date" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`payment_terms.${i}.invoice_document`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-500">Invoice Document</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      {!disabled && (
                        <Input
                          type="file"
                          className="bg-white"
                          onChange={async (e) => {
                            const fileObj = e.target.files?.[0]
                            if (fileObj) field.onChange((await uploadFile(fileObj)) as string)
                          }}
                        />
                      )}
                      {field.value ? (
                        <Link href={getFileUrl(field.value as string)} target="_blank" passHref title={getFileNameFromUrl(field.value as string)}>
                          <Button type="button" variant={disabled ? "default" : "outline"} size="sm" className="gap-1">
                            <File className="h-3.5 w-3.5" /> View
                          </Button>
                        </Link>
                      ) : (
                        disabled && <span className="text-sm text-gray-400">No document</span>
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`payment_terms.${i}.payment_receive_date`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-gray-500">Payment Receive Date</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} onDateChange={field.onChange} disabled={disabled} placeholder="Payment Receive Date" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {!disabled ? (
          <Button type="button" variant="outline" size="sm" onClick={addTerm} className="gap-1">
            <Plus className="h-4 w-4" /> Add Payment Term
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3 text-sm">
          <span className={cn("rounded px-2 py-0.5 font-medium", Math.abs(totalPct - 100) <= 0.01 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            {totalPct.toFixed(2)}% allocated
          </span>
          <span className="text-gray-600">
            {formatCurrency(totalAmount)} of {formatCurrency(baseAmount)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default StandalonePaymentTerms
