"use client"
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useFieldArray, useForm } from 'react-hook-form'
import { CircleCheck, CircleX, File, Pencil } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { renderDisabledInput } from '@/components/ui/disabledInput'
import { PAYMENT_STATUS_ENUM, useGetAmcByOrderIdQuery, useGetOrderByIdQuery, useUpdateAMCByOrderIdMutation, useUpdateOrderMutation } from '@/redux/api/order'
import Typography from '../ui/Typography'
import OrderDetail from '../Client/Add/Form/OrderDetail'
import { HTMLInputTypeAttribute, useEffect, useState } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useFileUpload } from '@/hooks/useFileUpload'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link'
import DatePicker from '../ui/datepicker'
import { OrderDetailInputs } from '@/types/order'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

interface IProps {
    orderId: string
}

export interface IAmcInputs {
    start_date: Date | undefined
    payments?: {
        from_date: Date;
        to_date: Date;
        status: PAYMENT_STATUS_ENUM;
        received_date: Date;
        purchase_order_number: string;
        purchase_order_document: string;
        purchase_order_date?: Date;
        invoice_document?: string;
        invoice_number: string;
        invoice_date?: Date;
    }[];
}

interface IDefaultValues {
    client: string
    total_cost: number
    amc_percentage: number
    amc_amount: number
    status: string
    payments?: {
        from_date: Date;
        to_date: Date;
        status: PAYMENT_STATUS_ENUM;
        received_date: Date;
        purchase_order_number: string;
        purchase_order_document: string;
        purchase_order_date?: Date;
        invoice_document?: string;
        invoice_number: string;
        invoice_date?: Date;
    }[];
    start_date: Date | undefined
}

type PaymentFieldName = `payments.${number}.status` |
    `payments.${number}.from_date` |
    `payments.${number}.to_date` |
    `payments.${number}.received_date` |
    `payments.${number}.purchase_order_number` |
    `payments.${number}.purchase_order_document` |
    `payments.${number}.purchase_order_date` |
    `payments.${number}.invoice_document` |
    `payments.${number}.invoice_number` |
    `payments.${number}.invoice_date`

const AmcForm: React.FC<{ orderId: string, defaultValue?: IDefaultValues }> = ({ orderId, defaultValue }) => {
    const [updateAMCApi, { isLoading }] = useUpdateAMCByOrderIdMutation()
    const [enableEdit, setEnableEdit] = useState(false)
    const { uploadFile, getFileNameFromUrl } = useFileUpload()

    const defaultValues: IAmcInputs = {
        start_date: defaultValue?.start_date || undefined,
        payments: defaultValue?.payments?.map(payment => ({
            ...payment,
            invoice_document: payment.invoice_document || '',
            invoice_date: payment.invoice_date || new Date()
        })) || []
    }

    const form = useForm<IAmcInputs>({
        defaultValues,
        mode: 'onChange'
    })
    const {
        fields: paymentsFields,
    } = useFieldArray({ control: form.control, name: 'payments', })

    const onSubmit = async (data: IAmcInputs) => {
        // check if payments status is changed but received date is not selected
        const isPaymentStatusChanged = data?.payments?.filter((_, index) => index !== 0)?.some((payment, index) => {
            return payment.status !== defaultValue?.payments?.[index].status
        })

        if (isPaymentStatusChanged) {
            const isReceivedDateNotSelected = data?.payments?.some((payment) => payment.status === PAYMENT_STATUS_ENUM.PAID && !payment.received_date)
            if (isReceivedDateNotSelected) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Please select received date for the payment'
                })
                return
            }
        }

        try {
            await updateAMCApi({ orderId, data }).unwrap()
            toast({
                variant: 'success',
                title: 'AMC Created Successfully',
                description: 'AMC has been created successfully'
            })
            setEnableEdit(false)
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Something went wrong'
            })
        }
    }

    const getSignedUrl = async (file: File, name: PaymentFieldName) => {
        const filename = await uploadFile(file);
        form.setValue(name, filename as string)
    }

    const renderInput = (name: PaymentFieldName, label: string, placeholder: string, type: HTMLInputTypeAttribute = "text") => {
        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) {
                await getSignedUrl(file, name);
            }
        };

        const renderFilePreview = (field: any) => (
            <div className="flex items-center gap-2">
                <Link href={field.value as string} target='_blank' passHref>
                    <Button variant={!enableEdit ? 'default' : 'outline'} type='button' className={enableEdit ? 'rounded-full w-8 h-8 ml-2 absolute -top-3 -right-10' : ''}>
                        {!enableEdit ? 'View' : <File className='w-1' />}
                    </Button>
                </Link>
                {
                    !enableEdit && (
                        <span className='text-sm text-gray-500'>{getFileNameFromUrl(field.value as string)}</span>
                    )
                }
            </div>
        );


        return (
            <FormField
                control={form.control}
                name={name}
                render={({ field }) => (
                    <FormItem className='w-full relative mb-4 md:mb-0'>
                        <FormLabel className='text-gray-500 relative block w-fit'>
                            {label}
                            {(type === "file" && field.value && enableEdit) && (
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

                        <FormControl>
                            {(type === "file" && field.value && !enableEdit) ? (
                                renderFilePreview(field)
                            ) : (
                                <Input
                                    type={type}
                                    {...field}
                                    disabled={!enableEdit}
                                    onChange={type === 'file' ? (e) => handleFileChange(e) : field.onChange}
                                    value={type === 'file' ? undefined : typeof field.value === 'string' || typeof field.value === 'number' ? field.value : undefined}
                                    className='bg-white'
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

    return (
        <div className="p-4 mt-4">
            <div className="flex items-center justify-between">
                <Typography variant='h2'>AMC Details</Typography>
                <div className="mb-2 flex justify-end">
                    <Button className={`w-36 justify-between ${enableEdit ? "bg-destructive hover:bg-destructive" : ""}`} onClick={() => setEnableEdit(prev => !prev)}>
                        {!enableEdit ? (
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
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
                    <div className="md:flex items-start gap-4 w-full">
                        <FormField
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>AMC Start Date</FormLabel>
                                    <FormControl>
                                        <DatePicker onDateChange={field.onChange} date={field.value} disabled={!enableEdit} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {renderDisabledInput("Total Cost", defaultValue?.total_cost)}
                    </div>
                    <div className="md:flex items-center gap-4 w-full">
                        {renderDisabledInput("AMC Percentage", defaultValue?.amc_percentage)}
                        {renderDisabledInput("AMC Amount(auto-calculated)", defaultValue?.amc_amount)}
                    </div>

                    <div className="space-y-6">
                        <Typography variant="h2" className="mb-4">Payments</Typography>
                        {paymentsFields.map((payment, index) => (
                            <Card key={payment.id} className="overflow-hidden">
                                <CardHeader className='flex flex-row justify-between items-center'>
                                    <CardTitle>Year {index + 1}</CardTitle>
                                    {
                                        index === 0 &&
                                        <Badge variant={"default"} className=''>{index === 0 ? "Free AMC" : "Subsequent Payment"}</Badge>
                                    }
                                </CardHeader>
                                <CardContent className="">
                                    <div className="flex gap-4 ">
                                        <FormField
                                            control={form.control}
                                            name={`payments.${index}.from_date`}
                                            render={({ field }) => (
                                                <FormItem className='w-full'>
                                                    <FormLabel className="text-gray-500">From</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <DatePicker onDateChange={field.onChange} date={field.value} disabled={true} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`payments.${index}.to_date`}
                                            render={({ field }) => (
                                                <FormItem className='w-full'>
                                                    <FormLabel className="text-gray-500">To</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <DatePicker onDateChange={field.onChange} date={field.value} disabled={true} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-4 items-end">
                                        <FormField
                                            control={form.control}
                                            name={`payments.${index}.status`}
                                            render={({ field }) => (
                                                <FormItem className='w-full mb-4 md:mb-0'>
                                                    <FormLabel className='text-gray-500'>Status</FormLabel>
                                                    <FormControl>
                                                        <Select onValueChange={field.onChange}>
                                                            <SelectTrigger className="w-full bg-white" disabled={!enableEdit}>
                                                                <SelectValue placeholder={field.value} className="capitalize" />
                                                            </SelectTrigger>
                                                            <SelectContent className='bg-white'>
                                                                {
                                                                    Object.entries(PAYMENT_STATUS_ENUM)
                                                                        .filter(([key]) => isNaN(Number(key)))
                                                                        .map(([key, value]: [string, PAYMENT_STATUS_ENUM]) => (
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
                                            name={`payments.${index}.received_date`}
                                            render={({ field }) => (
                                                <FormItem className='w-full'>
                                                    <FormLabel className="text-gray-500">Payment Receive Date</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <DatePicker date={field.value} onDateChange={field.onChange} placeholder="Pick a Date" disabled={!enableEdit} />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-4 items-end">
                                        <div className="w-full flex gap-4 mt-4 items-end">
                                            {renderInput(`payments.${index}.purchase_order_number`, "Purchase Order Number", "Enter Purchase Order Number")}
                                            {renderInput(`payments.${index}.purchase_order_document`, "Purchase Order Document", "Upload Purchase Order Document", "file")}
                                            <FormField
                                                control={form.control}
                                                name={`payments.${index}.purchase_order_date`}
                                                render={({ field }) => (
                                                    <FormItem className='w-full'>
                                                        <FormLabel className="text-gray-500">Purchase Order Date</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <DatePicker date={field.value} onDateChange={field.onChange} placeholder="Pick a Date" disabled={!enableEdit} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-4 items-end">
                                        <div className="w-full flex gap-4 mt-4 items-end">
                                            {renderInput(`payments.${index}.invoice_document`, "Invoice Document", "Upload Invoice Document", "file")}
                                            {renderInput(`payments.${index}.invoice_number`, "Invoice Number", "Enter Invoice Number")}
                                            <FormField
                                                control={form.control}
                                                name={`payments.${index}.invoice_date`}
                                                render={({ field }) => (
                                                    <FormItem className='w-full'>
                                                        <FormLabel className="text-gray-500">Invoice Date</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <DatePicker date={field.value} onDateChange={field.onChange} placeholder="Pick a Date" disabled={!enableEdit} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {
                        enableEdit &&
                        <div className="flex justify-end">
                            <Button type="submit" className='md:w-36 w-full py-5 md:py-2' disabled={isLoading || !form.formState.isDirty} loading={{ isLoading, loader: "tailspin" }}>
                                <CircleCheck />
                                <span className='text-white'>Save AMC</span>
                            </Button>
                        </div>
                    }
                </form>
            </Form>
        </div>
    )
}



const AMCDetail: React.FC<IProps> = ({ orderId }) => {
    const { data } = useGetAmcByOrderIdQuery(orderId)
    const { data: orderData } = useGetOrderByIdQuery(orderId)

    const [defaultValues, setDefaultValues] = useState<IDefaultValues>({
        client: '',
        total_cost: 0,
        amc_percentage: 0,
        amc_amount: 0,
        status: '',
        start_date: undefined,
    })

    useEffect(() => {
        if (data?.data && orderData?.data) {
            setDefaultValues({
                client: data?.data.client.name,
                total_cost: data?.data.total_cost,
                amc_percentage: orderData?.data.amc_rate.percentage,
                amc_amount: data?.data.amount,
                status: orderData?.data.status,
                start_date: data?.data.start_date,
                payments: data?.data.payments
            })
        }
    }, [data, orderData])

    const productsName = data?.data.products.map((product) => product.name).join(', ')

    const [updateFirstOrderApi, { isLoading: isUpdateOrderLoading }] = useUpdateOrderMutation()

    const updateOrderHandler = async (data: OrderDetailInputs) => {
        if (!orderData?.data._id) {
            toast({
                variant: "destructive",
                title: "Error Occured while updating a client",
                description: "Please create a first order before updating"
            })
            return
        }

        try {
            await updateFirstOrderApi({ ...data, orderId: orderData?.data._id }).unwrap()
            toast({
                variant: "success",
                title: "Order Updated",
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while adding a client",
                description: error?.message || `Please try again and if error still persist contact the developer`
            })
        }
    }

    return (
        <>
            <div className='flex items-center'>
                <Typography variant='h1' className='md:text-3xl text-2xl'>{data?.data.client.name} Of {productsName}</Typography>
                {
                    orderData?.data.status === "active" ?
                        <div className={`md:w-4 md:h-4 w-2.5 h-2.5 rounded-full bg-green-500 ml-2`}></div> :
                        <div className={`md:w-4 md:h-4 w-2.5 h-2.5 rounded-full bg-red-500 ml-2`}></div>
                }
            </div>

            <br />
            <OrderDetail isLoading={isUpdateOrderLoading} title="Order Detail" handler={async () => { }} defaultValue={orderData?.data} updateHandler={updateOrderHandler} defaultOpen={false} />

            <AmcForm orderId={orderId} defaultValue={defaultValues} />
        </>
    )
}

export default AMCDetail