"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { CircleCheck, CircleX, File, Trash } from "lucide-react"
import {
    PAYMENT_STATUS_ENUM,
    useUpdateAMCPaymentByIdMutation,
    useDeleteAMCPaymentByIdMutation
} from "@/redux/api/order"
import DatePicker from "../ui/datepicker"
import type { IAMCPayment } from "@/types/order"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { useFileUpload } from "@/hooks/useFileUpload"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { useState } from "react"

interface IProps {
    payment: IAMCPayment
    amcId: string
    onClose: () => void
}

type IPaymentForm = IAMCPayment

const AMCPayment = ({ payment, amcId, onClose }: IProps) => {
    const { uploadFile, getFileNameFromUrl } = useFileUpload()
    const [updateAMCPayment, { isLoading }] = useUpdateAMCPaymentByIdMutation()
    const [deleteAMCPayment, { isLoading: isDeleting }] = useDeleteAMCPaymentByIdMutation()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const form = useForm<IPaymentForm>({
        defaultValues: {
            status: payment.status,
            from_date: new Date(payment.from_date),
            to_date: new Date(payment.to_date),
            received_date: payment.received_date ? new Date(payment.received_date) : undefined,
            proforma_date: payment.proforma_date ? new Date(payment.proforma_date) : undefined,
            purchase_order_number: payment.purchase_order_number || "",
            purchase_order_document: payment.purchase_order_document || "",
            invoice_document: payment.invoice_document || "",
            invoice_number: payment.invoice_number || "",
            invoice_date: payment.invoice_date ? new Date(payment.invoice_date) : undefined,
            amc_rate_applied: payment.amc_rate_applied,
            amc_rate_amount: payment.amc_rate_amount,
            total_cost: payment.total_cost,
            _id: payment._id
        }
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

        // Validation based on status
        const currentStatus = data.status as PAYMENT_STATUS_ENUM;
        
        // Validate required fields based on status
        if (currentStatus === PAYMENT_STATUS_ENUM.proforma || 
            currentStatus === PAYMENT_STATUS_ENUM.INVOICE || 
            currentStatus === PAYMENT_STATUS_ENUM.PAID) {
            if (!data.proforma_date) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "proforma date is required when status is proforma or beyond."
                });
                return;
            }
        }

        if (currentStatus === PAYMENT_STATUS_ENUM.INVOICE || 
            currentStatus === PAYMENT_STATUS_ENUM.PAID) {
            if (!data.invoice_date) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Invoice date is required when status is Invoice or beyond."
                });
                return;
            }
            
            if (!data.invoice_document) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Invoice document is required when status is Invoice or beyond."
                });
                return;
            }
        }

        if (currentStatus === PAYMENT_STATUS_ENUM.PAID) {
            if (!data.received_date) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Payment receive date is required when status is Paid."
                });
                return;
            }
        }

       
        try {
            await updateAMCPayment({
                id: amcId,
                paymentId: payment._id,
                data: {
                    ...data,
                    received_date: data.received_date || undefined,
                    invoice_date: data.invoice_date || undefined,
                    proforma_date: data.proforma_date || undefined,
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

    const handleDelete = async () => {
        try {
            await deleteAMCPayment({
                amcId,
                paymentId: payment._id
            }).unwrap()

            toast({
                variant: "success",
                title: "Payment deleted successfully",
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
        type: "text" | "file" | "number" = "text",
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
                                    value={type === "number" ? (field.value as number || '') : (field.value as string || '')}
                                    onChange={(e) => {
                                        if (type === "number") {
                                            field.onChange(e.target.valueAsNumber || 0)
                                        } else {
                                            field.onChange(e.target.value)
                                        }
                                    }}
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

    const paymentStatusColor = (status: PAYMENT_STATUS_ENUM) => {
        if (status === PAYMENT_STATUS_ENUM.PAID) return "bg-green-700"
        if (status === PAYMENT_STATUS_ENUM.PENDING) return "bg-red-600"
        if (status === PAYMENT_STATUS_ENUM.proforma) return "bg-yellow-600"
        if (status === PAYMENT_STATUS_ENUM.INVOICE) return "bg-blue-600"
    }

    // Check if a field is required based on current status
    const isFieldRequired = (fieldName: string) => {
        const currentStatus = form.getValues('status') as PAYMENT_STATUS_ENUM;
        
        if (fieldName === 'proforma_date') {
            return [PAYMENT_STATUS_ENUM.proforma, PAYMENT_STATUS_ENUM.INVOICE, PAYMENT_STATUS_ENUM.PAID].includes(currentStatus);
        }
        
        if (fieldName === 'invoice_date' || fieldName === 'invoice_document') {
            return [PAYMENT_STATUS_ENUM.INVOICE, PAYMENT_STATUS_ENUM.PAID].includes(currentStatus);
        }
        
        if (fieldName === 'received_date') {
            return currentStatus === PAYMENT_STATUS_ENUM.PAID;
        }
        
        return false;
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                        <div className="flex items-center">
                                                            <div className={`w-2 h-2 rounded-full ${paymentStatusColor(value)} mr-2`}></div>
                                                            <span className="capitalize">{value}</span>
                                                        </div>
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
                            name="proforma_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={`text-gray-500 ${isFieldRequired('proforma_date') ? 'after:content-["*"] after:text-red-500 after:ml-0.5' : ''}`}>
                                        proforma Date
                                    </FormLabel>
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

                    <div className="grid grid-cols-1 gap-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="invoice_document"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={`text-gray-500 ${isFieldRequired('invoice_document') ? 'after:content-["*"] after:text-red-500 after:ml-0.5' : ''}`}>
                                        Invoice Document
                                    </FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            {field.value && (
                                                <div className="flex items-center gap-2">
                                                    <Link href={field.value as string} target="_blank" passHref>
                                                        <Button variant="outline" type="button">
                                                            <File className="w-4 h-4 mr-2" />
                                                            View File
                                                        </Button>
                                                    </Link>
                                                    <span className="text-sm text-gray-500">{getFileNameFromUrl(field.value as string)}</span>
                                                </div>
                                            )}
                                            <Input
                                                type="file"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        const filename = await uploadFile(file)
                                                        field.onChange(filename)
                                                    }
                                                }}
                                                className="bg-white"
                                                placeholder="Upload Invoice Document"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {renderInput("invoice_number", "Invoice Number", "Enter Invoice Number")}
                        <FormField
                            control={form.control}
                            name="invoice_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={`text-gray-500 ${isFieldRequired('invoice_date') ? 'after:content-["*"] after:text-red-500 after:ml-0.5' : ''}`}>
                                        Invoice Date
                                    </FormLabel>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {renderInput(
                            "amc_rate_applied",
                            "AMC Rate (%)",
                            "Enter AMC Rate",
                            "number"
                        )}
                        {renderInput(
                            "amc_rate_amount",
                            "AMC Rate Amount",
                            "Enter AMC Rate Amount",
                            "number"
                        )}
                        {renderInput(
                            "total_cost",
                            "Total Cost",
                            "Enter Total Cost",
                            "number"
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <FormField
                            control={form.control}
                            name="received_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className={`text-gray-500 ${isFieldRequired('received_date') ? 'after:content-["*"] after:text-red-500 after:ml-0.5' : ''}`}>
                                        Payment Receive Date
                                    </FormLabel>
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

                    <div className="flex justify-between gap-2">
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete Payment
                        </Button>
                        <div className="flex gap-2">
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
                    </div>
                </form>
            </Form>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Payment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this payment? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button
                            type="button" 
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            loading={{ isLoading: isDeleting, loader: "tailspin" }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default AMCPayment