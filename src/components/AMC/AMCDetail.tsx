"use client"
import { Button } from "@/components/ui/button"
import { File, Pencil, Info, ArrowUp, Edit, CircleX, CircleCheck } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
    PAYMENT_STATUS_ENUM,
    useGetAmcByOrderIdQuery,
    useGetAMCPaymentReviewMutation,
    useGetOrderByIdQuery,
    useUpdateAMCByIdMutation,
    useUpdateOrderMutation,
} from "@/redux/api/order"
import Typography from "../ui/Typography"
import OrderDetail from "../Client/Add/Form/OrderDetail"
import { useEffect, useState } from "react"
import Link from "next/link"
import type { IAMCObject, IAMCPayment, OrderDetailInputs } from "@/types/order"
import { Badge } from "../ui/badge"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import AMCPayment from "./AMCPayment"
import AmcPaymentReview from "./AmcPaymentReview"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable,
} from "@tanstack/react-table"
import React from "react"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form"
import { Input } from "../ui/input"

interface IProps {
    orderId: string
}

interface IDefaultValues {
    _id: string
    client: string
    total_cost: number
    amc_percentage: number
    amc_amount: number
    status: string
    payments?: IAMCPayment[]
    start_date: Date | undefined
}

interface DataTableProps {
    data: IAMCPayment[]
    onEdit: (payment: IAMCPayment) => void
    onInfo: (payment: IAMCPayment, initialAmcRate: number) => void
    initialAmcRate: number
}


const columns = (onEdit: (payment: IAMCPayment) => void, onInfo: (payment: IAMCPayment, initialAmcRate: number) => void, initialAmcRate: number): ColumnDef<IAMCPayment>[] => [
    {
        accessorKey: "_id",
        header: "Sr No.",
        cell: ({ row, table }) => {
            const index = table.getRowModel().rows.findIndex(r => r.id === row.id)
            const is_free_amc = row.original.is_free_amc

            return (
                <div className="flex items-center gap-2">
                    {index + 1}
                    {is_free_amc && (
                        <Badge variant={"default"}>
                            {index === 0 ? "Free AMC" : "Subsequent Payment"}
                        </Badge>
                    )}
                </div>
            )
        }
    },
    {
        accessorKey: "from_date",
        header: "From Date",
        cell: ({ row }) => new Date(row.getValue("from_date")).toLocaleDateString()
    },
    {
        accessorKey: "to_date",
        header: "To Date",
        cell: ({ row }) => new Date(row.getValue("to_date")).toLocaleDateString()
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as PAYMENT_STATUS_ENUM
            return (
                <Badge variant={status === PAYMENT_STATUS_ENUM.PAID ? "success" : "destructive"}>
                    {status}
                </Badge>
            )
        },
        filterFn: (row, id, value) => {
            return value === "ALL" || row.getValue(id) === value
        }
    },
    {
        accessorKey: "received_date",
        header: "Received Date",
        cell: ({ row }) => {
            const date = row.getValue("received_date") as Date
            return date ? new Date(date).toLocaleDateString() : '-'
        }
    },
    {
        accessorKey: "amc_rate_applied",
        header: "AMC Rate (%)",
        cell: ({ row }) => {
            const rate = row.getValue("amc_rate_applied") as number | undefined
            if (!rate) return '-'
            return (
                <div className="flex items-center gap-1">
                    {rate}%
                    {rate > initialAmcRate && (
                        <Badge variant="outline" className="bg-green-50">
                            <ArrowUp className="w-3 h-3 text-green-600 mr-1" />
                            {(rate - initialAmcRate)}%
                        </Badge>
                    )}
                </div>
            )
        }
    },
    {
        accessorKey: "amc_rate_amount",
        header: "AMC Amount",
        cell: ({ row }) => {
            const amount = row.getValue("amc_rate_amount") as number | undefined
            return amount ? `₹${amount.toLocaleString()}` : '-'
        }
    },
    {
        accessorKey: "total_cost",
        header: "Total Cost",
        cell: ({ row }) => {
            const amount = row.getValue("total_cost") as number | undefined
            return amount ? `₹${amount.toLocaleString()}` : '-'
        }
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const payment = row.original
            return (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(payment)}
                    >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onInfo(payment, initialAmcRate)}
                    >
                        <Info className="w-4 h-4 mr-2" />
                        Info
                    </Button>
                </div>
            )
        }
    }
]

const DataTable = ({ data, onEdit, onInfo, initialAmcRate }: DataTableProps) => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

    const table = useReactTable({
        data,
        columns: columns(onEdit, onInfo, initialAmcRate),
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: setColumnFilters,
        state: {
            columnFilters,
        },
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant={!table.getColumn("status")?.getFilterValue() ? "default" : "outline"}
                    onClick={() => table.getColumn("status")?.setFilterValue("ALL")}
                >
                    All
                </Button>
                <Button
                    type="button"
                    variant={table.getColumn("status")?.getFilterValue() === PAYMENT_STATUS_ENUM.PENDING ? "default" : "outline"}
                    onClick={() => table.getColumn("status")?.setFilterValue(PAYMENT_STATUS_ENUM.PENDING)}
                >
                    Pending
                </Button>
                <Button
                    type="button"
                    variant={table.getColumn("status")?.getFilterValue() === PAYMENT_STATUS_ENUM.PAID ? "default" : "outline"}
                    onClick={() => table.getColumn("status")?.setFilterValue(PAYMENT_STATUS_ENUM.PAID)}
                >
                    Paid
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

const AmcForm: React.FC<{ orderId: string; defaultValue?: IDefaultValues, amcStartDate?: string }> = ({ orderId, defaultValue, amcStartDate }) => {
    const [getAMCPaymentReviewApi, { isLoading: isGetAMCPaymentReviewLoading, data: amcPaymentReviewData }] = useGetAMCPaymentReviewMutation()
    const [enablePaymentEdit, setEnablePaymentEdit] = useState<{ payment: IAMCPayment | null, editing: boolean } | null>({ payment: null, editing: false })
    const [selectedPaymentInfo, setSelectedPaymentInfo] = useState<{ payment: IAMCPayment | null, initialAmcRate: number, show: boolean }>({ payment: null, initialAmcRate: 0, show: false })
    const [showPaymentReview, setShowPaymentReview] = useState(false)
    const [disableInput, setDisableInput] = useState(true)

    const [updateAMCByIdApi, { isLoading: isUpdateAMCByIdLoading }] = useUpdateAMCByIdMutation()

    const form = useForm<Pick<IAMCObject, "amount">>({
        defaultValues: {
            amount: defaultValue?.amc_amount || 0
        },
        values:{
            amount: defaultValue?.amc_amount || 0
        }
    })

    const handleEdit = (payment: IAMCPayment) => {
        setEnablePaymentEdit({ payment, editing: true })
    }

    const handleInfo = (payment: IAMCPayment, initialAmcRate: number) => {
        setSelectedPaymentInfo({
            payment,
            initialAmcRate,
            show: true
        })
    }

    const onSubmit = async (data: Pick<IAMCObject, "amount">) => {
        try {
            await updateAMCByIdApi({ id: defaultValue?._id || "", data: { amount: Number(data.amount) } }).unwrap()
            toast({
                variant: "success",
                title: "AMC Updated",
            })
            setDisableInput(true)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while updating AMC",
                description: error?.message || `Please try again and if error still persist contact the developer`,
            })
        }
    }

    return (
        <div className="p-4 mt-4">
            <div className="flex items-center justify-between">
                <Typography variant="h2">AMC Details</Typography>
                {defaultValue?._id && (
                    <Button 
                        type='button' 
                        className={`w-36 justify-between ${!disableInput ? "bg-destructive hover:bg-destructive" : ""}`} 
                        onClick={() => setDisableInput(prev => !prev)}
                    >
                        {disableInput ? (
                            <>
                                <Edit />
                                <span>Start Editing</span>
                            </>
                        ) : (
                            <>
                                <CircleX />
                                <span>Close Editing</span>
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div className="space-y-8 mt-5">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Typography variant="h4" className="text-gray-500">AMC Start Date</Typography>
                                <Typography variant="p">{amcStartDate ? new Date(amcStartDate).toLocaleDateString() : '-'}</Typography>
                            </div>
                            <div>
                                <Typography variant="h4" className="text-gray-500">Total Cost</Typography>
                                <Typography variant="p">₹{defaultValue?.total_cost.toLocaleString()}</Typography>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <Typography variant="h4" className="text-gray-500">AMC Percentage</Typography>
                                <Typography variant="p">{defaultValue?.amc_percentage}%</Typography>
                            </div>
                            <div>
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AMC Amount</FormLabel>
                                            <FormControl>
                                                <Input {...field} disabled={disableInput} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end mt-4">
                            {!disableInput && (
                                <div className="flex gap-2">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => {
                                            form.reset()
                                            setDisableInput(true)
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        loading={{ isLoading: isUpdateAMCByIdLoading, loader: "tailspin" }}
                                    >
                                        <CircleCheck className="mr-2" />
                                        Save changes
                                    </Button>
                                </div>
                            )}
                        </div>
                    </form>
                </Form>

                <div className="space-y-6">
                    <Typography variant="h2" className="mb-4">Payments</Typography>

                    {defaultValue?.payments?.length ? (
                        <DataTable
                            data={defaultValue.payments}
                            onEdit={handleEdit}
                            onInfo={handleInfo}
                            initialAmcRate={defaultValue?.amc_percentage || 0}
                        />
                    ) : (
                        <Button variant="outline" onClick={async () => {
                            await getAMCPaymentReviewApi(orderId).unwrap()
                            setShowPaymentReview(true)
                        }} loading={{ isLoading: isGetAMCPaymentReviewLoading, loader: "tailspin" }}>
                            Review and Add Payments
                        </Button>
                    )}
                </div>
            </div>

            {showPaymentReview && (
                <Dialog open={showPaymentReview} onOpenChange={setShowPaymentReview}>
                    <DialogContent className="max-w-screen-lg overflow-y-auto max-h-[90vh]" >
                        <DialogTitle>Payment Review</DialogTitle>
                        {
                            amcPaymentReviewData?.data && (
                                <AmcPaymentReview amcId={defaultValue?._id || ""} data={amcPaymentReviewData.data} handler={() => {
                                    setShowPaymentReview(false)
                                }} />
                            )
                        }
                    </DialogContent>
                </Dialog>
            )}

            {enablePaymentEdit && enablePaymentEdit.payment && (
                <Dialog open={enablePaymentEdit.editing} onOpenChange={(open) => setEnablePaymentEdit({ payment: null, editing: open })}>
                    <DialogContent className="max-w-screen-lg overflow-y-auto max-h-[90vh]">
                        <DialogTitle>Update Payment</DialogTitle>
                        <AMCPayment payment={enablePaymentEdit.payment} amcId={defaultValue?._id || ""} onClose={() => setEnablePaymentEdit({ payment: null, editing: false })} />
                    </DialogContent>
                </Dialog>
            )}

            {selectedPaymentInfo.show && selectedPaymentInfo.payment && (
                <Dialog open={selectedPaymentInfo.show} onOpenChange={(open) => setSelectedPaymentInfo({ payment: null, initialAmcRate: 0, show: open })}>
                    <DialogContent className="max-w-md">
                        <DialogTitle>Payment Information</DialogTitle>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Typography variant="p" className="text-sm text-gray-500">Current AMC Rate</Typography>
                                    <div className="flex items-center gap-2">
                                        <Typography variant="p" className="text-lg font-semibold">{selectedPaymentInfo.payment.amc_rate_applied}%</Typography>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Typography variant="p" className="text-sm text-gray-500">Total Cost</Typography>
                                    <Typography variant="p" className="text-lg font-semibold">₹{defaultValue?.total_cost.toLocaleString()}</Typography>
                                </div>
                                <div>
                                    <Typography variant="p" className="text-sm text-gray-500">AMC Amount</Typography>
                                    <Typography variant="p" className="text-lg font-semibold">₹{defaultValue?.amc_amount.toLocaleString()}</Typography>
                                </div>
                            </div>

                            <div>
                                <Typography variant="p" className="text-sm text-gray-500">Payment Period</Typography>
                                <Typography variant="p" className="text-base">
                                    {new Date(selectedPaymentInfo.payment.from_date).toLocaleDateString()} - {new Date(selectedPaymentInfo.payment.to_date).toLocaleDateString()}
                                </Typography>
                            </div>

                            <div>
                                <Typography variant="p" className="text-sm text-gray-500">Documents</Typography>
                                <div className="space-y-2 mt-2">
                                    {selectedPaymentInfo.payment.purchase_order_document && (
                                        <div className="flex items-center gap-2">
                                            <Link href={selectedPaymentInfo.payment.purchase_order_document} target="_blank">
                                                <Button variant="outline" size="sm">
                                                    <File className="w-4 h-4 mr-2" />
                                                    Purchase Order
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                    {selectedPaymentInfo.payment.invoice_document && (
                                        <div className="flex items-center gap-2">
                                            <Link href={selectedPaymentInfo.payment.invoice_document} target="_blank">
                                                <Button variant="outline" size="sm">
                                                    <File className="w-4 h-4 mr-2" />
                                                    Invoice
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

const AMCDetail: React.FC<IProps> = ({ orderId }) => {
    const { data } = useGetAmcByOrderIdQuery(orderId)
    const { data: orderData } = useGetOrderByIdQuery(orderId)

    const [defaultValues, setDefaultValues] = useState<IDefaultValues>({
        _id: "",
        client: "",
        total_cost: 0,
        amc_percentage: 0,
        amc_amount: 0,
        status: "",
        start_date: undefined,
    })

    useEffect(() => {
        if (data?.data && orderData?.data) {
            setDefaultValues({
                _id: data?.data._id || "",
                client: data?.data.client.name,
                total_cost: data?.data.total_cost,
                amc_percentage: orderData?.data.amc_rate.percentage,
                amc_amount: data?.data.amount,
                status: orderData?.data.status,
                start_date: data?.data.start_date,
                payments: data?.data.payments,
            })
        }
    }, [data, orderData])

    const productsName = data?.data.products.map((product) => product.name).join(", ")

    const [updateFirstOrderApi, { isLoading: isUpdateOrderLoading }] = useUpdateOrderMutation()

    const updateOrderHandler = async (data: OrderDetailInputs) => {
        if (!orderData?.data._id) {
            toast({
                variant: "destructive",
                title: "Error Occured while updating a client",
                description: "Please create a first order before updating",
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
                description: error?.message || `Please try again and if error still persist contact the developer`,
            })
        }
    }

    return (
        <>
            <div className="flex items-center">
                <Typography variant="h1" className="md:text-3xl text-2xl">
                    {data?.data.client.name} Of {productsName}
                </Typography>
                {orderData?.data.status === "active" ? (
                    <div className={`md:w-4 md:h-4 w-2.5 h-2.5 rounded-full bg-green-500 ml-2`}></div>
                ) : (
                    <div className={`md:w-4 md:h-4 w-2.5 h-2.5 rounded-full bg-red-500 ml-2`}></div>
                )}
            </div>

            <br />
            <OrderDetail
                isLoading={isUpdateOrderLoading}
                title="Order Detail"
                handler={async () => { }}
                defaultValue={orderData?.data}
                updateHandler={updateOrderHandler}
                defaultOpen={false}
            />

            <AmcForm orderId={orderId} defaultValue={defaultValues} amcStartDate={orderData?.data.amc_start_date} />
        </>
    )
}

export default AMCDetail

