import React, { HTMLInputTypeAttribute, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import Typography from '@/components/ui/Typography'
import { CircleCheck, CircleX, File, Pencil } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useGetPurchasedProductsByClientQuery } from '@/redux/api/client'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import DatePicker from '@/components/ui/datepicker'
import { useFileUpload } from '@/hooks/useFileUpload'
import { toast } from '@/hooks/use-toast'
import { ILicenceObject, PAYMENT_STATUS_ENUM } from '@/types/order'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { renderDisabledInput } from '@/components/ui/disabledInput'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { AmountInput } from '@/components/ui/AmountInput'

interface ILicenseProps {
    clientId: string
    handler: (data: ILicenseInputs, orderId?: string) => void
    isLoading: boolean
    label?: string
    disable?: boolean
    defaultValue?: ILicenceObject
    onPurchaseOrderNumberChange?: (value: string) => void
    onProductChange?: (productId: string) => void
}

export interface ILicenseInputs {
    cost_per_license: number;
    total_license: number;
    product_id: string;
    purchase_date: Date;
    purchase_order_document: string;
    purchase_order_number: string;
    payment_receive_date?: Date;
    payment_status?: PAYMENT_STATUS_ENUM;
    invoice_document: string;
    invoice_number: string;
    invoice_date?: Date;
    amc_rate?: {
        percentage: number;
        amount: number;
    };
}

const LicenseForm: React.FC<ILicenseProps> = ({ clientId, handler, isLoading, label, defaultValue, disable = false, onPurchaseOrderNumberChange, onProductChange }) => {
    const { data: productsList } = useGetPurchasedProductsByClientQuery(clientId)
    const [isPercentage, setIsPercentage] = useState(true)
    const { uploadFile, getFileNameFromUrl } = useFileUpload()

    const [disableInput, setDisableInput] = useState(disable)

    const defaultValues = {
        cost_per_license: defaultValue?.rate.amount || 0,
        total_license: defaultValue?.total_license || 0,
        product_id: defaultValue?.product_id || '',
        purchase_date: defaultValue?.purchase_date ? new Date(defaultValue?.purchase_date) : undefined,
        purchase_order_document: defaultValue?.purchase_order_document || "",
        purchase_order_number: defaultValue?.purchase_order_number || "",
        invoice_document: defaultValue?.invoice_document || "",
        invoice_number: defaultValue?.invoice_number || "",
        invoice_date: defaultValue?.invoice_date ? new Date(defaultValue?.invoice_date) : undefined,
        payment_status: defaultValue?.payment_status || PAYMENT_STATUS_ENUM.PENDING,
        payment_receive_date: defaultValue?.payment_receive_date ? new Date(defaultValue?.payment_receive_date) : undefined,
        amc_rate: defaultValue?.amc_rate || { percentage: 0, amount: 0 }
    }

    const form = useForm<ILicenseInputs>({ defaultValues })

    useEffect(() => {
        if (defaultValue?._id) {
            // set values on the form
            form.setValue('cost_per_license', defaultValue.rate.amount)
            form.setValue('total_license', defaultValue.total_license)
            form.setValue('product_id', defaultValue.product_id)
            form.setValue('purchase_date', defaultValue.purchase_date ? new Date(defaultValue.purchase_date) : new Date())
            form.setValue('purchase_order_document', defaultValue.purchase_order_document)
            form.setValue('purchase_order_number', defaultValue.purchase_order_number)
            form.setValue('invoice_document', defaultValue.invoice_document)
            form.setValue('invoice_number', defaultValue.invoice_number)
            form.setValue('invoice_date', defaultValue.invoice_date ? new Date(defaultValue.invoice_date) : undefined)
            form.setValue('payment_status', defaultValue.payment_status)
            form.setValue('payment_receive_date', defaultValue.payment_receive_date ? new Date(defaultValue.payment_receive_date) : undefined)
            form.setValue('amc_rate', defaultValue.amc_rate || { percentage: 0, amount: 0 })
        }
    }, [defaultValue])

    useEffect(() => {
        if (disable !== undefined) setDisableInput(disable)
    }, [disable])

    const getSignedUrl = async (file: File, field: keyof ILicenseInputs) => {
        const filename = await uploadFile(file);
        form.setValue(field, filename as string)
    }

    const renderFormField = (name: Exclude<keyof ILicenseInputs, 'purchase_date'>, label: string, placeholder: string, type: HTMLInputTypeAttribute = "number") => {
        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                await getSignedUrl(file, name);
            }
        };

        const renderFilePreview = (field: any) => {
            return (
                <div className="flex items-center gap-2">
                    <Link href={field.value as string} target='_blank' passHref>
                        <Button variant={disableInput ? 'default' : 'outline'} type='button' className={!disableInput ? 'rounded-full w-8 h-8 ml-2 absolute -top-3 -right-10' : ''}>
                            {disableInput ? 'View' : <File className='w-1' />}
                        </Button>
                    </Link>
                    {
                        disableInput && (
                            <span className='text-sm text-gray-500'>{getFileNameFromUrl(field.value as string)}</span>
                        )
                    }
                </div>
            )
        };

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            form.setValue(name, e.target.value)
            if (name === 'cost_per_license' || name === "total_license") recalculateAMCAmount()
        }

        return (
            <FormField
                control={form.control}
                name={name}
                render={({ field }) => (
                    <FormItem className='w-full mb-4 md:mb-0'>
                        {label && (
                            <FormLabel className='text-gray-500 relative w-fit block'>
                                {label}
                                {(type === "file" && field.value && !disableInput) && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {renderFilePreview(field)}
                                            </TooltipTrigger>
                                            <TooltipContent>{getFileNameFromUrl(field.value as string) || 'View File'}</TooltipContent>
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
                                    onChange={type === 'file' ? (e) => handleFileChange(e) : onChange}
                                    value={(type === 'number' && field.value === 0) ? '' : (type === 'file' ? undefined : field.value as string)}
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

    const onSubmit = async (data: ILicenseInputs) => {
        const requiredFields = {
            cost_per_license: 'Cost Per License',
            total_license: 'Total License',
            product_id: 'Product',
            purchase_date: 'Purchase Date',
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([key]) => !data[key as keyof typeof data])
            .map(([, label]) => label);

        if (missingFields.length > 0) {
            toast({
                variant: "destructive",
                title: "Error",
                description: `Please fill the following required fields: ${missingFields.join(', ')}`
            });
            return;
        }

        if (data.payment_status === PAYMENT_STATUS_ENUM.PAID && !data.payment_receive_date) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Payment receive date is required when payment status is paid"
            });
            return;
        }

        const product = productsList?.data.find((product) => product._id === data.product_id)
        if (!product) {
            throw new Error('Product not found')
        }
        handler(data, product.order_id)
    }

    const selectPlaceHolder = (name: "product_id", value: string) => {
        if (!value) return "Select a Product"

        const placeholders = {
            product_id: () => productsList?.data.find(product => product._id === value)?.name,
            type: () => value.charAt(0).toUpperCase() + value.slice(1)
        }

        return placeholders[name]?.() || "Select a Product"
    }

    const recalculateAMCAmount = () => {
        const costPerLicense = Number(form.getValues('cost_per_license')) || 0
        const totalLicenses = Number(form.getValues('total_license')) || 0
        const amcRate = form.getValues('amc_rate')
        const amcPercentage = amcRate?.percentage || 0

        const totalLicenseCost = costPerLicense * totalLicenses
        const newAmcAmount = (totalLicenseCost * amcPercentage) / 100

        form.setValue('amc_rate', { percentage: amcPercentage, amount: newAmcAmount })
    }

    return (
        <div className="bg-custom-gray bg-opacity-75 rounded p-4 relative">
            <div className="flex items-center justify-between mb-6">
                <Typography variant='h1'>{label}</Typography>
                <div className="flex items-center gap-3">
                    <Card className='border-0 shadow-sm bg-white'>
                        <CardContent className="flex items-center gap-3 py-2 px-4">
                            <span className="text-sm text-gray-500">Total Cost</span>
                            <span className="text-lg font-semibold">{formatCurrency((form.watch("cost_per_license") || 0) * (form.watch("total_license") || 0))}</span>
                        </CardContent>
                    </Card>
                    {defaultValue?._id && (
                        <Button className={`justify-between gap-2 ${!disableInput ? "bg-destructive hover:bg-destructive" : ""}`}
                            onClick={() => setDisableInput(prev => !prev)}>
                            {disableInput ? <Pencil className="w-4 h-4" /> : <CircleX className="w-4 h-4" />}
                            <span className='hidden md:inline'>{disableInput ? "Edit" : "Cancel"}</span>
                        </Button>
                    )}
                </div>
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
                                                    field.onChange(value)
                                                    onProductChange?.(value)
                                                    const product = productsList?.data.find((product) => product._id === value)
                                                    if (product) {
                                                        form.setValue('cost_per_license', product.cost_per_license)
                                                        const totalLicenseCost = product.cost_per_license * (form.getValues('total_license') || 0)
                                                        const newAmcAmount = (totalLicenseCost * product.amc_rate.percentage) / 100
                                                        form.setValue('amc_rate', {
                                                            percentage: product.amc_rate.percentage,
                                                            amount: newAmcAmount
                                                        })
                                                    }
                                                }}>
                                                    <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                        <SelectValue placeholder={selectPlaceHolder('product_id', field.value)} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {productsList?.data.filter(product => product.does_have_license).map((product) => (
                                                            <SelectItem value={product._id} key={product._id}>{product.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {renderFormField('cost_per_license', 'Cost Per License', 'Enter cost per license')}
                                {renderFormField('total_license', 'Total License', 'Enter total license')}
                                <FormField
                                    control={form.control}
                                    name="purchase_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>Purchase Date</FormLabel>
                                            <FormControl>
                                                <DatePicker disabled={disableInput} date={field.value} onDateChange={field.onChange} placeholder='Pick a Date' />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amc_rate"
                                    render={({ field }) => {
                                        const totalLicenseCost = (Number(form.getValues('cost_per_license')) || 0) * (Number(form.getValues('total_license')) || 0)
                                        return (
                                            <FormItem>
                                                <FormLabel className='text-gray-500 text-sm'>AMC Rate <span className="text-gray-400 font-normal">({formatCurrency(field.value?.amount || 0)})</span></FormLabel>
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
                                                                const calculatedAmount = (totalLicenseCost * percentage) / 100
                                                                field.onChange({ percentage, amount: calculatedAmount })
                                                            } else {
                                                                const amount = parseFloat(value.toString()) || 0
                                                                const calculatedPercentage = totalLicenseCost ? ((amount / totalLicenseCost) * 100).toFixed(2) : 0
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
                                {renderFormField('purchase_order_document', 'Purchase Order Document', 'Upload Purchase Order Document', 'file')}
                                {renderFormField('invoice_document', 'Invoice Document', 'Upload Invoice Document', 'file')}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoice & Payment */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Invoice & Payment</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="purchase_order_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>Purchase Order Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        onPurchaseOrderNumberChange?.(e.target.value);
                                                    }}
                                                    value={field.value}
                                                    disabled={disableInput}
                                                    className='bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                                    placeholder='Enter purchase order number'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="invoice_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>Invoice Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    {...field}
                                                    onChange={field.onChange}
                                                    value={field.value}
                                                    disabled={disableInput}
                                                    className='bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                                    placeholder='Enter invoice number'
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                <FormField
                                    control={form.control}
                                    name={`payment_status`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>Payment Status</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                        <SelectValue className="capitalize" placeholder=
                                                            {
                                                                field.value === PAYMENT_STATUS_ENUM.PAID ? (
                                                                    <div className="flex items-center">
                                                                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                                        {PAYMENT_STATUS_ENUM.PAID}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center">
                                                                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                                                        <span className="capitalize">{PAYMENT_STATUS_ENUM.PENDING}</span>
                                                                    </div>
                                                                )
                                                            }
                                                        >
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className='bg-white'>
                                                        {
                                                            Object.entries(PAYMENT_STATUS_ENUM)
                                                                .filter(([key]) => isNaN(Number(key)))
                                                                .map(([key, value]) => (
                                                                    <SelectItem value={value} key={key} className='capitalize'>
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
                                                                ))
                                                        }
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`payment_receive_date`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className='text-gray-500 text-sm'>Payment Receive Date</FormLabel>
                                            <FormControl>
                                                <DatePicker date={field.value} onDateChange={field.onChange} placeholder='Payment Receive Date' disabled={disableInput} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" className='md:w-36 w-full py-5 md:py-2' disabled={isLoading || disableInput} loading={{ isLoading, loader: "tailspin" }} >
                            <CircleCheck />
                            <span className='text-white'>Save License</span>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}

export default LicenseForm