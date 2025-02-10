"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CircleCheck, CircleX, File } from "lucide-react"
import {
    PAYMENT_STATUS_ENUM,
    useUpdateAMCPaymentByIdMutation
} from "@/redux/api/order"
import DatePicker from "../ui/datepicker"
import type { IAMCPayment } from "@/types/order"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { useFileUpload } from "@/hooks/useFileUpload"
import Link from "next/link"

interface IProps {
    payment: IAMCPayment
    amcId: string
    onClose: () => void
}

type IPaymentForm = IAMCPayment

const AMCPayment = ({ payment, amcId, onClose }: IProps) => {
    const { uploadFile, getFileNameFromUrl } = useFileUpload()
    const [updateAMCPayment, { isLoading }] = useUpdateAMCPaymentByIdMutation()

    const form = useForm<IPaymentForm>({
        defaultValues: {
            status: payment.status,
            from_date: new Date(payment.from_date),
            to_date: new Date(payment.to_date),
            received_date: payment.received_date ? new Date(payment.received_date) : undefined,
            purchase_order_number: payment.purchase_order_number || "",
            purchase_order_document: payment.purchase_order_document || "",
            invoice_document: payment.invoice_document || "",
            invoice_number: payment.invoice_number || "",
            invoice_date: payment.invoice_date ? new Date(payment.invoice_date) : undefined,
            amc_rate_applied: payment.amc_rate_applied,
            amc_rate_amount: payment.amc_rate_amount,
            total_cost: payment.total_cost,
            _id: payment._id
        },
    })


    const onSubmit = async (data: IPaymentForm) => {
        if (!payment._id) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Payment ID is missing",
            })
            return
        }

        try {
            await updateAMCPayment({
                id: amcId,
                paymentId: payment._id,
                data: {
                    ...data,
                    received_date: data.received_date || undefined,
                    invoice_date: data.invoice_date || undefined,
                }
            }).unwrap()

            toast({
                variant: "success",
                title: "Payment Updated Successfully",
            })
            onClose()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Something went wrong",
            })
        }
    }

    const renderInput = (
        name: keyof IPaymentForm,
        label: string,
        placeholder: string,
        type: "text" | "file" = "text",
    ) => {
        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) {
                const filename = await uploadFile(file)
                form.setValue(name, filename as string, { shouldDirty: true })
            }
        }

        const renderFilePreview = (field: any) => (
            <div className="flex items-center gap-2">
                <Link href={field.value as string} target="_blank" passHref>
                    <Button variant="outline" type="button">
                        <File className="w-4 h-4 mr-2" />
                        View File
                    </Button>
                </Link>
                <span className="text-sm text-gray-500">{getFileNameFromUrl(field.value as string)}</span>
            </div>
        )

        return (
            <FormField
                control={form.control}
                name={name}
                render={({ field }) => (
                    <FormItem className="w-full relative mb-4">
                        <FormLabel className="text-gray-500">{label}</FormLabel>
                        <FormControl>
                            {type === "file" ? (
                                <div className="space-y-2">
                                    {field.value && renderFilePreview(field)}
                                    <Input
                                        type={type}
                                        onChange={handleFileChange}
                                        className="bg-white"
                                        placeholder={placeholder}
                                    />
                                </div>
                            ) : (
                                <Input
                                    type={type}
                                    {...field}
                                    value={typeof field.value === 'string' ? field.value : ''}
                                    className="bg-white"
                                    placeholder={placeholder}
                                />
                            )}
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="from_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-500">From</FormLabel>
                                <FormControl>
                                    <DatePicker onDateChange={field.onChange} date={field.value} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="to_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-500">To</FormLabel>
                                <FormControl>
                                    <DatePicker onDateChange={field.onChange} date={field.value} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-500">Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder={field.value} className="capitalize" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {Object.entries(PAYMENT_STATUS_ENUM)
                                            .filter(([key]) => isNaN(Number(key)))
                                            .map(([key, value]: [string, PAYMENT_STATUS_ENUM]) => (
                                                <SelectItem value={value} key={key} className="capitalize">
                                                    {value === PAYMENT_STATUS_ENUM.PAID ? (
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                            {value}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center">
                                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                                            <span className="capitalize">{value}</span>
                                                        </div>
                                                    )}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="received_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-500">Payment Receive Date</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={field.value || undefined}
                                        onDateChange={(date) => field.onChange(date)}
                                        placeholder="Pick a Date"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {renderInput(
                        "purchase_order_number",
                        "Purchase Order Number",
                        "Enter Purchase Order Number"
                    )}
                    {renderInput(
                        "purchase_order_document",
                        "Purchase Order Document",
                        "Upload Purchase Order Document",
                        "file"
                    )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {renderInput(
                        "invoice_document",
                        "Invoice Document",
                        "Upload Invoice Document",
                        "file"
                    )}
                    {renderInput("invoice_number", "Invoice Number", "Enter Invoice Number")}
                    <FormField
                        control={form.control}
                        name="invoice_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-gray-500">Invoice Date</FormLabel>
                                <FormControl>
                                    <DatePicker
                                        date={field.value || undefined}
                                        onDateChange={(date) => field.onChange(date)}
                                        placeholder="Pick a Date"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                    >
                        <CircleX className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading || !form.formState.isDirty}
                        loading={{ isLoading, loader: "tailspin" }}
                    >
                        <CircleCheck className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    )
}

export default AMCPayment