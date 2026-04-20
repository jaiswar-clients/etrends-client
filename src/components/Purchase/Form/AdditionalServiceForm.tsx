import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import Typography from '@/components/ui/Typography'
import { useGetPurchasedProductsByClientQuery } from '@/redux/api/client'
import { CircleCheck, CircleX, File, Pencil } from 'lucide-react'
import React, { HTMLInputTypeAttribute, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useFileUpload } from '@/hooks/useFileUpload'
import DatePicker from '@/components/ui/datepicker'
import { toast } from '@/hooks/use-toast'
import { IAdditionalServiceObject, PAYMENT_STATUS_ENUM } from '@/types/order'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { renderDisabledInput } from '@/components/ui/disabledInput'
import { AmountInput } from '@/components/ui/AmountInput'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface IAdditionalServiceProps {
    clientId: string
    handler: (data: IAdditionalServiceInputs, orderId?: string) => void
    isLoading: boolean
    label?: string
    disable?: boolean
    defaultValue?: IAdditionalServiceObject
    onPurchaseOrderNumberChange?: (value: string) => void
    onInvoiceNumberChange?: (value: string) => void
    onProductChange?: (productId: string) => void
}

export interface IAdditionalServiceInputs {
    product_id: string;
    name: string;
    date: {
        start: Date;
        end: Date;
    };
    cost: number;
    payment_receive_date?: Date;
    payment_status?: PAYMENT_STATUS_ENUM;
    purchase_order_document?: string;
    purchase_order_number: string;
    service_document?: string;
    invoice_document?: string;
    invoice_number: string;
    invoice_date: Date;
    amc_rate?: {
        percentage: number;
        amount: number;
    };
}

const AdditionalServiceForm: React.FC<IAdditionalServiceProps> = ({ clientId, label, handler, isLoading, defaultValue, disable, onPurchaseOrderNumberChange, onInvoiceNumberChange, onProductChange }) => {
    const { data: productsList } = useGetPurchasedProductsByClientQuery(clientId)
    const { uploadFile, getFileNameFromUrl } = useFileUpload()
    const [disableInput, setDisableInput] = useState(disable)
    const [isPercentage, setIsPercentage] = useState(true)

    const defaultValues: IAdditionalServiceInputs = {
        product_id: defaultValue?.product_id ?? '',
        name: defaultValue?.name ?? '',
        date: {
            start: defaultValue?.date?.start ? new Date(defaultValue.date.start) : new Date(),
            end: defaultValue?.date?.end ? new Date(defaultValue.date.end) : new Date()
        },
        cost: defaultValue?.cost ?? 0,
        purchase_order_document: defaultValue?.purchase_order_document ?? '',
        purchase_order_number: defaultValue?.purchase_order_number ?? '',
        service_document: defaultValue?.service_document ?? '',
        invoice_document: defaultValue?.invoice_document ?? '',
        invoice_number: defaultValue?.invoice_number ?? '',
        invoice_date: defaultValue?.invoice_date ? new Date(defaultValue.invoice_date) : new Date(),
        payment_status: defaultValue?.payment_status ?? PAYMENT_STATUS_ENUM.PENDING,
        payment_receive_date: defaultValue?.payment_receive_date ? new Date(defaultValue.payment_receive_date) : undefined,
        amc_rate: defaultValue?.amc_rate || { percentage: 0, amount: 0 }
    }

    const form = useForm<IAdditionalServiceInputs>({
        defaultValues,
        mode: 'onChange'
    })

    useEffect(() => {
        if (defaultValue) {
            form.reset(defaultValues)
        }
    }, [defaultValue])

    useEffect(() => {
        if (disable !== undefined) setDisableInput(disable)
    }, [disable])

    const renderFormField = (name: keyof IAdditionalServiceInputs | 'date.start' | 'date.end', label: string, placeholder: string, type: HTMLInputTypeAttribute = "text") => {
        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                const filename = await uploadFile(file);
                form.setValue(name as keyof IAdditionalServiceInputs, filename);
            }
        };

        const renderFilePreview = (field: any) => {
            if (!field.value) return null;
            return (
                <div className="flex items-center gap-2">
                    <Link href={field.value} target='_blank' passHref>
                        <Button variant={disableInput ? 'default' : 'outline'} type='button' className={!disableInput ? 'rounded-full w-8 h-8 ml-2 absolute -top-3 -right-10' : ''}>
                            {disableInput ? 'View' : <File className='w-1' />}
                        </Button>
                    </Link>
                    {disableInput && (
                        <span className='text-sm text-gray-500'>{getFileNameFromUrl(field.value)}</span>
                    )}
                </div>
            )
        };

        return (
            <FormField
                control={form.control}
                name={name as any}
                render={({ field }) => (
                    <FormItem className='w-full mb-4 md:mb-0'>
                        {label && (
                            <FormLabel className='text-gray-500 relative block w-fit'>
                                {label}
                                {(type === "file" && field.value && !disableInput) && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {renderFilePreview(field)}
                                            </TooltipTrigger>
                                            <TooltipContent>{getFileNameFromUrl(field.value) || 'View File'}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </FormLabel>
                        )}
                        <FormControl>
                            {(type === "file" && field.value && disableInput) ? (
                                renderFilePreview(field)
                            ) : (
                                <Input
                                    type={type}
                                    {...field}
                                    onChange={type === 'file' ? handleFileChange : (e) => {
                                        field.onChange(e);
                                        if (name === 'purchase_order_number') {
                                            onPurchaseOrderNumberChange?.(e.target.value);
                                        }
                                        if (name === 'invoice_number') {
                                            onInvoiceNumberChange?.(e.target.value);
                                        }
                                        if (name === 'cost') {
                                            const newCost = Number(e.target.value) || 0;
                                            const amcRate = form.getValues('amc_rate')
                                            const newAmount = (newCost * (amcRate?.percentage || 0)) / 100
                                            form.setValue('amc_rate', { percentage: amcRate?.percentage || 0, amount: newAmount })
                                        }
                                    }}
                                    value={type === 'file' ? undefined : field.value ?? ''}
                                    disabled={disableInput}
                                    className='bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                    placeholder={placeholder}
                                />
                            )}
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    }

    const onSubmit = async (data: IAdditionalServiceInputs) => {
        const missingFields = [
            !data.product_id && 'Product',
            !data.name && 'Service Name',
            !data.date.start && 'Start Date',
            !data.date.end && 'End Date',
            !data.cost && 'Cost'
        ].filter(Boolean);

        if (missingFields.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Required Fields Missing',
                description: `Please fill the following fields: ${missingFields.join(', ')}`
            })
            return
        }
        const product = productsList?.data.find((product) => product._id === data.product_id)
        if (!product) {
            throw new Error('Product not found')
        }
        await handler(data, product.order_id)
    }

    const selectPlaceHolder = (name: "product_id" | "type", value: string) => {
        if (!value) return "Select a Product"

        const placeholders = {
            product_id: () => productsList?.data.find(product => product._id === value)?.name,
            type: () => value.charAt(0).toUpperCase() + value.slice(1)
        }

        return placeholders[name]?.() || "Select a Product"
    }

    return (
        <div className="bg-custom-gray bg-opacity-75 rounded p-4 relative">
            <div className="flex items-center justify-between mb-6">
                <Typography variant='h1'>{label}</Typography>
                {defaultValue?._id && (
                    <Button className={`justify-between gap-2 ${!disableInput ? "bg-destructive hover:bg-destructive" : ""}`}
                        onClick={() => setDisableInput(prev => !prev)}>
                        {disableInput ? <Pencil className="w-4 h-4" /> : <CircleX className="w-4 h-4" />}
                        <span className='hidden md:inline'>{disableInput ? "Edit" : "Cancel"}</span>
                    </Button>
                )}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Product Details */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Product Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="product_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>Product</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={(value) => {
                                                    field.onChange(value);
                                                    onProductChange?.(value);
                                                    const product = productsList?.data.find((product) => product._id === value)
                                                    if (product) {
                                                        const cost = Number(form.getValues('cost')) || 0
                                                        const newAmcAmount = (cost * product.amc_rate.percentage) / 100
                                                        form.setValue('amc_rate', {
                                                            percentage: product.amc_rate.percentage,
                                                            amount: newAmcAmount
                                                        })
                                                    }
                                                }}>
                                                    <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                        <SelectValue placeholder={selectPlaceHolder("product_id", field.value)} />
                                                    </SelectTrigger>
                                                    <SelectContent className='bg-white'>
                                                        {productsList?.data.map((product) => (
                                                            <SelectItem key={product._id} value={product._id}>
                                                                {product.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {renderFormField('name', 'Service Name', 'Enter service name')}
                                <FormField
                                    control={form.control}
                                    name="date.start"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>Start Date</FormLabel>
                                            <FormControl>
                                                <DatePicker disabled={disableInput} date={field.value} onDateChange={field.onChange} placeholder='Pick start date' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="date.end"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>End Date</FormLabel>
                                            <FormControl>
                                                <DatePicker disabled={disableInput} date={field.value} onDateChange={field.onChange} placeholder='Pick end date' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {renderFormField('cost', 'Cost', 'Enter cost', 'number')}
                                <FormField
                                    control={form.control}
                                    name="amc_rate"
                                    render={({ field }) => {
                                        const cost = Number(form.getValues('cost')) || 0
                                        return (
                                            <FormItem>
                                                <FormLabel className='text-gray-500 text-sm'>AMC Rate ({formatCurrency(field.value?.amount || 0)})</FormLabel>
                                                <FormControl>
                                                    <AmountInput
                                                        className='bg-white'
                                                        placeholder='AMC Rate'
                                                        disabled={disableInput}
                                                        defaultInputValue={{
                                                            percentage: field.value?.percentage || 0,
                                                            value: field.value?.amount || 0
                                                        }}
                                                        onModeChange={(isPct) => setIsPercentage(isPct)}
                                                        onValueChange={(value: number | null) => {
                                                            if (!value) return
                                                            if (isPercentage) {
                                                                const percentage = parseFloat(value.toString()) || 0
                                                                const calculatedAmount = (cost * percentage) / 100
                                                                field.onChange({ percentage, amount: calculatedAmount })
                                                            } else {
                                                                const amount = parseFloat(value.toString()) || 0
                                                                const calculatedPercentage = cost ? ((amount / cost) * 100).toFixed(2) : 0
                                                                field.onChange({ percentage: parseFloat(calculatedPercentage as string), amount })
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Documents</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderFormField('service_document', 'Service Document', 'Upload service document', 'file')}
                                {renderFormField('purchase_order_document', 'Purchase Order Document', 'Upload purchase order document', 'file')}
                                {renderFormField('invoice_document', 'Invoice Document', 'Upload invoice document', 'file')}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice Details */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Invoice Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderFormField('purchase_order_number', 'Purchase Order Number', 'Enter purchase order number', 'text')}
                                {renderFormField('invoice_number', 'Invoice Number', 'Enter invoice number', 'text')}
                                <FormField
                                    control={form.control}
                                    name="invoice_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>Invoice Date</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    date={field.value}
                                                    onDateChange={field.onChange}
                                                    disabled={disableInput}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" className='md:w-48 w-full py-5 md:py-2' disabled={isLoading || disableInput} loading={{ isLoading, loader: "tailspin" }}>
                            <CircleCheck />
                            <span className='text-white'>Save Service</span>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}

export default AdditionalServiceForm