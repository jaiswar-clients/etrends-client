"use client"

import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronDown } from 'lucide-react'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination"
import { IPendingPayment, IPendingPaymentPagination, IPendingPaymentType, IUpdatePendingPaymentRequest, PAYMENT_STATUS_ENUM, useUpdatePendingPaymentMutation } from "@/redux/api/order"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form"
import { Input } from "../ui/input"
import DatePicker from "../ui/datepicker"
import { toast } from "@/hooks/use-toast"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"

interface IProps {
    data: IPendingPayment[]
    pagination: IPendingPaymentPagination
    handlePagination: (page: number) => void
}

export default function DataTableWithModalAndPagination({ data, pagination, handlePagination }: IProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [updatePayment, setUpdatePayment] = useState<{ modal: boolean, data: IUpdatePendingPaymentRequest }>({
        modal: false, data: {
            payment_identifier: '',
            status: '',
            payment_receive_date: new Date(),
            type: 'PENDING' as IPendingPaymentType,
            _id: ''
        }
    })

    const [
        updatePendingPaymentApi,
        { isLoading }
    ] = useUpdatePendingPaymentMutation()

    const form = useForm<
        { payment_receive_date: Date, status: PAYMENT_STATUS_ENUM }
    >({
        defaultValues: {
            payment_receive_date: undefined,
            status: PAYMENT_STATUS_ENUM.PAID
        }
    })

    const {
        handleSubmit,
    } = form

    const [selectedItem, setSelectedItem] = useState<IPendingPayment | null>(null)

    const handleRowClick: (item: IPendingPayment) => void = (item) => {
        const payment_identifier = (item.type === "order" || item.type === "amc") ? item.payment_identifier : item._id
        setSelectedItem({ ...item, payment_identifier })
        setIsModalOpen(true)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }

    console.log(updatePayment)
    const onSubmit = async (data: { payment_receive_date: Date, status: PAYMENT_STATUS_ENUM }) => {
        if (!data.payment_receive_date) {
            toast({
                title: 'Payment Receive Date is required',
                description: 'Please select a date',
                variant: 'destructive'
            })
            return
        }
        try {
            await updatePendingPaymentApi({
                payment_identifier: updatePayment?.data.payment_identifier ?? '',
                status: PAYMENT_STATUS_ENUM.PAID,
                payment_receive_date: data.payment_receive_date,
                type: updatePayment.data.type as IPendingPaymentType,
                _id: updatePayment.data._id
            }).unwrap()
            toast({
                title: 'Payment Updated',
                description: 'Payment has been successfully updated',
                variant: 'success'
            })
            setUpdatePayment({ modal: false, data: updatePayment.data })
            setIsModalOpen(false)
        } catch (error) {
            console.log(error)
            toast({
                title: 'Error',
                description: 'An error occurred while updating the payment',
                variant: 'destructive'
            })
        }
    }

    const [columnFilters, setColumnFilters] = useState<{
        client_name?: string;
        type?: string;
        status?: string;
    }>({})

    const uniqueTypes = useMemo(
        () => Array.from(new Set(data.map((d) => d.type))),
        [data]
    )
    const uniqueStatuses = useMemo(
        () => Array.from(new Set(data.map((d) => d.status))),
        [data]
    )

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesClientName = !columnFilters.client_name ||
                item.client_name.toLowerCase().includes(columnFilters.client_name.toLowerCase())
            const matchesType = !columnFilters.type ||
                item.type === columnFilters.type
            const matchesStatus = !columnFilters.status ||
                item.status === columnFilters.status
            return matchesClientName && matchesType && matchesStatus
        })
    }, [data, columnFilters])

    const renderFilters = () => (
        <div className="flex items-center justify-between py-4">
            <Input
                placeholder="Filter clients..."
                value={columnFilters.client_name || ''}
                onChange={(e) => setColumnFilters(prev => ({ ...prev, client_name: e.target.value }))}
                className="max-w-sm"
            />
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto capitalize">
                            {columnFilters.type || 'Type'} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {uniqueTypes.map((type) => (
                            <DropdownMenuCheckboxItem
                                key={type}
                                className="capitalize"
                                checked={columnFilters.type === type}
                                onCheckedChange={(checked) => {
                                    setColumnFilters(prev => ({
                                        ...prev,
                                        type: checked ? type : undefined
                                    }))
                                }}
                            >
                                {type}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto capitalize">
                            {columnFilters.status || 'Status'} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {uniqueStatuses.map((status) => (
                            <DropdownMenuCheckboxItem
                                key={status}
                                className="capitalize"
                                checked={columnFilters.status === status}
                                onCheckedChange={(checked) => {
                                    setColumnFilters(prev => ({
                                        ...prev,
                                        status: checked ? status : undefined
                                    }))
                                }}
                            >
                                {status}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )

    const paymentStatusColor = (status: PAYMENT_STATUS_ENUM) => {
        if (status === PAYMENT_STATUS_ENUM.PAID) return "bg-green-700"
        if (status === PAYMENT_STATUS_ENUM.PENDING) return "bg-red-600"
        if (status === PAYMENT_STATUS_ENUM.PERFORMA) return "bg-yellow-600"
        if (status === PAYMENT_STATUS_ENUM.INVOICE) return "bg-blue-600"
    }

    return (
        <div className="container">
            {renderFilters()}
            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pending Amount</TableHead>
                            <TableHead>Payment Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map((item) => (
                            <TableRow
                                key={item._id}
                                onClick={() => handleRowClick(item)}
                                className="cursor-pointer hover:bg-muted/50"
                            >
                                <TableCell className="font-medium">{item.client_name}</TableCell>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell>{item.type}</TableCell>
                                <TableCell>{item.status}</TableCell>
                                <TableCell>{formatCurrency(item.pending_amount)}</TableCell>
                                <TableCell>{formatDate(item.payment_date)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {filteredData.length} of {data.length} items (Total {pagination.total})
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            {pagination.currentPage > 1 ? (
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePagination(pagination.currentPage - 1);
                                    }}
                                />
                            ) : (
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="opacity-50 cursor-not-allowed"
                                />
                            )}
                        </PaginationItem>

                        {Array.from({ length: pagination.totalPages }).map((_, index) => {
                            const pageNumber = index + 1;
                            // Show first, last, current and pages around current
                            if (
                                pageNumber === 1 ||
                                pageNumber === pagination.totalPages ||
                                Math.abs(pageNumber - pagination.currentPage) <= 1
                            ) {
                                return (
                                    <PaginationItem key={pageNumber}>
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePagination(pageNumber);
                                            }}
                                            isActive={pagination.currentPage === pageNumber}
                                        >
                                            {pageNumber}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            }

                            // Show ellipsis for skipped pages
                            if (
                                (pageNumber === 2 && pagination.currentPage > 3) ||
                                (pageNumber === pagination.totalPages - 1 && pagination.currentPage < pagination.totalPages - 2)
                            ) {
                                return (
                                    <PaginationItem key={pageNumber}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }

                            return null;
                        })}

                        <PaginationItem>
                            {pagination.currentPage < pagination.totalPages ? (
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePagination(pagination.currentPage + 1);
                                    }}
                                />
                            ) : (
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="opacity-50 cursor-not-allowed"
                                />
                            )}
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Item Details</DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="mt-4">
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Name</TableCell>
                                        <TableCell>{selectedItem.client_name}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Type</TableCell>
                                        <TableCell>{selectedItem.type}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Status</TableCell>
                                        <TableCell>
                                            <span className={`${paymentStatusColor(selectedItem.status)} text-white px-2 py-1 rounded-md`}>{selectedItem.status}</span>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Pending Amount</TableCell>
                                        <TableCell>{formatCurrency(selectedItem.pending_amount)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Payment Date</TableCell>
                                        <TableCell>{formatDate(selectedItem.payment_date)}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    )}
                    <div className="mt-6 flex justify-end">
                        <Button variant={"secondary"} onClick={() => setIsModalOpen(false)}>Close</Button>
                        <Button className="ml-2"
                            onClick={() => {
                                setUpdatePayment({
                                    modal: true,
                                    data: {
                                        payment_identifier: selectedItem?.payment_identifier ?? '',
                                        status: selectedItem?.status ?? '',
                                        payment_receive_date: new Date(selectedItem?.payment_date ?? Date.now()),
                                        type: selectedItem?.type as IPendingPaymentType,
                                        _id: selectedItem?._id ?? ''
                                    }
                                })
                            }
                            }
                        >Update</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={updatePayment.modal} onOpenChange={() => setUpdatePayment({ modal: false, data: updatePayment.data })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Payment</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <Form {...form}>
                            <form action="" onSubmit={handleSubmit(onSubmit)}>
                                <FormItem >
                                    <FormLabel htmlFor="payment_identifier">Payment Status</FormLabel>
                                    <Input value={PAYMENT_STATUS_ENUM.PAID} disabled />
                                </FormItem>

                                <br />
                                <FormField
                                    control={form.control}
                                    name={`payment_receive_date`}
                                    render={({ field }) => (
                                        <FormItem className='w-full mb-4 md:mb-0'>
                                            <FormLabel className='text-gray-500'>Payment Receive Date</FormLabel>
                                            <FormControl>
                                                <DatePicker onDateChange={field.onChange} date={field.value} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="mt-6 flex justify-end">
                                    <Button variant={"secondary"} type="button" onClick={() => setUpdatePayment({ modal: false, data: updatePayment.data })}>Close</Button>
                                    <Button className="ml-2 w-36" type="submit" loading={{
                                        isLoading,
                                        loader: "tailspin"
                                    }}>Update</Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

