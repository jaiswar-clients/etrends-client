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

interface ILicenseProps {
    clientId: string
    handler: (data: ILicenseInputs, orderId?: string) => void
    isLoading: boolean
    label?: string
    disable?: boolean
    defaultValue?: ILicenceObject
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
}

const LicenseForm: React.FC<ILicenseProps> = ({ clientId, handler, isLoading, label, defaultValue, disable = false }) => {
    const { data: productsList } = useGetPurchasedProductsByClientQuery(clientId)
    const [amcRate, setAmcRate] = useState({ percentage: 0, amount: 0, total_amount: 0 })
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
        payment_receive_date: defaultValue?.payment_receive_date ? new Date(defaultValue?.payment_receive_date) : undefined
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
        if (!form.getValues('cost_per_license') || !form.getValues('total_license')) return

        const amcPercentage = amcRate.percentage
        const totalOrderCost = amcRate.total_amount
        const costPerLicense = form.getValues('cost_per_license') || 0
        const totalLicenses = form.getValues('total_license') || 0

        const totalLicenseCost = Number(costPerLicense) * Number(totalLicenses)
        const newAmcAmount = ((totalLicenseCost + totalOrderCost) * amcPercentage) / 100

        setAmcRate(prev => ({
            ...prev,
            amount: newAmcAmount
        }))
    }

    return (
        <div className="bg-custom-gray bg-opacity-75 rounded p-4 relative">
            <div className="flex items-center justify-between">
                <div className="flex justify-between w-full items-center mt-5">
                    <Typography variant='h1'>{label}</Typography>
                    <div className="flex justify-end mt-4">
                        <Card className='items-center'>
                            <CardContent className="flex items-center gap-2 justify-center p-3">
                                <Typography variant='h3'>Total Cost</Typography>
                                <Typography variant='p' className='flex items-center '>
                                    <span className="font-bold">{formatCurrency((form.watch("cost_per_license") || 0) * (form.watch("total_license") || 0))}</span>
                                </Typography>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                {defaultValue?._id && (
                    <div className="mb-2 flex justify-end absolute top-0 right-0">
                        <Button className={`w-36 justify-between ${!disableInput ? "bg-destructive hover:bg-destructive" : ""}`}
                            onClick={() => setDisableInput(prev => !prev)}>
                            {disableInput ? (
                                <>
                                    <Pencil />
                                    <span>Start Editing</span>
                                </>
                            ) : (
                                <>
                                    <CircleX />
                                    <span>Close Editing</span>
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
                    <div className="md:flex items-end gap-4 w-full">
                        <FormField
                            control={form.control}
                            name="product_id"
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>Product ID</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={(value) => {
                                            field.onChange(value)
                                            const product = productsList?.data.find((product) => product._id === value)
                                            if (product) {
                                                form.setValue('cost_per_license', product.cost_per_license)
                                                setAmcRate({ percentage: product.amc_rate.percentage, amount: product.amc_rate.amount, total_amount: product.total_cost })
                                            }
                                        }}>
                                            <SelectTrigger className="w-full" disabled={disableInput}>
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
                    </div>
                    <div className="md:flex items-center gap-4 w-full">
                        {renderFormField('total_license', 'Total License', 'Enter total license')}
                        <div className="md:flex items-end gap-4 w-full">
                            {renderDisabledInput("AMC Percentage", amcRate.percentage, "number")}
                            {renderDisabledInput("AMC Amount", amcRate.amount, "number")}
                        </div>
                    </div>
                    <div className="md:flex items-end gap-4 w-full">
                        <FormField
                            control={form.control}
                            name="purchase_date"
                            render={({ field }) => (
                                <FormItem className='w-full'>
                                    <FormLabel className='text-gray-500'>Purchase Date</FormLabel>
                                    <FormControl>
                                        <DatePicker disabled={disableInput} date={field.value} onDateChange={field.onChange} placeholder='Pick a Date' />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="md:flex items-center gap-4 w-full">
                            {renderFormField('purchase_order_document', 'Purchase Order Document', 'Upload Purchase Order Document', 'file')}
                            {renderFormField('invoice_document', 'Invoice Document', 'Upload Invoice Document', 'file')}
                        </div>
                    </div>
                    <div className="md:flex items-end gap-4 w-full">
                        <FormField
                            control={form.control}
                            name="purchase_order_number"
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>Purchase Order Number</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            {...field}
                                            onChange={field.onChange}
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
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>Invoice Number</FormLabel>
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
                    </div>
                    <div className="md:flex items-end gap-4 w-full">
                        <FormField
                            control={form.control}
                            name="invoice_date"
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>Invoice Date</FormLabel>
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
                    <div className="md:flex items-end gap-4 w-full">
                        <FormField
                            control={form.control}
                            name={`payment_status`}
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>Payment Status</FormLabel>
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
                                <FormItem className='w-full relative'>
                                    <FormLabel className='text-gray-500'>Payment Receive Date</FormLabel>
                                    <FormControl>
                                        <DatePicker date={field.value} onDateChange={field.onChange} placeholder='Payment Receive Date' disabled={disableInput} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

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