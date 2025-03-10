'use client'

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    ColumnFiltersState,
    getSortedRowModel,
    getFilteredRowModel,
    VisibilityState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useMemo, useState } from 'react'
import { Input } from '../ui/input'
import Typography from '../ui/Typography'
import { TransformedAMCObject } from '@/redux/api/order'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppSelector } from '@/redux/hook'
import { AMC_FILTER } from './AMC'
import { DatePickerWithRange } from '../ui/daterangepicker'
import { formatCurrency } from '@/lib/utils'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
} from "@/components/ui/pagination"

const upcomingMonths = [
    {
        id: 0,
        name: "Upcoming 1 month",
        value: 1
    },
    {
        id: 1,
        name: "Upcoming 2 months",
        value: 2
    },
    {
        id: 2,
        name: "Upcoming 3 months",
        value: 3
    },
]

interface IProps {
    pagination: {
        total: number;
        limit: number;
        page: number;
        pages: number;
    }
    data: TransformedAMCObject[]
    changeFilter: (filter: AMC_FILTER, options?: { upcoming: number, startDate?: string, endDate?: string }) => void
    onPageChange: (page: number) => void
    currentPage: number
}


type TableData = {
    id: string;
    client: string;
    order: string;
    status: string;
    due_date: string;
    orderId: string
    amount: string
}


const columns: ColumnDef<TableData>[] = [
    {
        accessorKey: 'client',
        header: 'Client',
    },
    {
        accessorKey: 'order',
        header: 'Order',
    },
    {
        accessorKey: 'status',
        header: 'Payment Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string
            return (
                <Badge variant={status !== 'pending' ? 'success' : 'destructive'}>
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "amount",
        header: "Amount"
    },
    {
        accessorKey: 'due_date',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Due Date
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = row.getValue('due_date') as string
            const formattedDate = new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
            });
            return (
                <span>{formattedDate}</span>
            )
        },
    },
]

const AMCList: React.FC<IProps> = ({ data, changeFilter, onPageChange, currentPage, pagination }) => {
    const [sorting, setSorting] = useState<SortingState>([
        {
            id: 'due_date',
            desc: true
        }
    ])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [dateRangeSelector, setDateRangeSelector] = useState({ show: false, startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), endDate: new Date() })

    const [showUpcomingMonthsFilter, setShowUpcomingMonthsFilter] = useState(true)
    const [activeFilter, setActiveFilter] = useState<AMC_FILTER>(AMC_FILTER.UPCOMING)

    const router = useRouter()

    const products = useAppSelector((state) => state.user.products)

    const tableData = useMemo(() => {
        return data.map((d) => ({
            id: d._id,
            client: d.client.name,
            order: d.products.map((p) => p.short_name).join(', '),
            status: d.last_payment?.status || '',
            due_date: new Date(d.last_payment?.from_date ?? '').toLocaleDateString(),
            orderId: d.order?._id,
            amount: formatCurrency(d.amount)
        }))
    }, [data])

    // Extract unique clients and products
    const uniqueClients = useMemo(
        () => Array.from(new Set(tableData.map((d) => d.client))),
        [tableData]
    )
    const uniqueProducts = useMemo(
        () => [...new Set(products.map((product) => product.short_name))],
        [products]
    )

    const table = useReactTable({
        data: tableData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        enableSorting: true,
        initialState: {
            sorting: [
                {
                    id: 'due_date',
                    desc: true
                }
            ]
        }
    })

    return (
        <div>
            <Typography variant="h1">AMC List</Typography>
            <div className="flex items-center justify-between py-4 flex-wrap gap-3">
                <Input
                    placeholder="Filter clients..."
                    value={(table.getColumn('client')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('client')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <div className="flex item-center gap-4 ">
                    {/* Clients Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                {(table.getColumn('client')?.getFilterValue() as string) ?? 'Clients'}{' '}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueClients.map((client) => (
                                <DropdownMenuCheckboxItem
                                    key={client}
                                    className="capitalize"
                                    checked={
                                        table.getColumn('client')?.getFilterValue() === client
                                    }
                                    onCheckedChange={(value) => {
                                        table
                                            .getColumn('client')
                                            ?.setFilterValue(value ? client : '')
                                    }}
                                >
                                    {client}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Products Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                {(table.getColumn('order')?.getFilterValue() as string) || 'Products'} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueProducts.map((product) => (
                                <DropdownMenuCheckboxItem
                                    key={product}
                                    className="capitalize"
                                    checked={
                                        table.getColumn('order')?.getFilterValue() === product
                                    }
                                    onCheckedChange={(value) => {
                                        table
                                            .getColumn('order')
                                            ?.setFilterValue(value ? product : '')
                                    }}
                                >
                                    {product}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {
                        // Upcoming Months Selector
                        showUpcomingMonthsFilter &&
                        <div className="flex items-center gap-2">
                            <Select defaultValue={'1'} onValueChange={(value: string) => {
                                if (value === 'custom') {
                                    setDateRangeSelector({ show: true, startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), endDate: new Date() })
                                } else {
                                    setDateRangeSelector({ show: false, startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), endDate: new Date() })
                                    changeFilter(AMC_FILTER.UPCOMING, { upcoming: Number(value) })
                                }
                            }}>
                                <SelectTrigger className="w-[180px] capitalize">
                                    <SelectValue placeholder="Select Months" />
                                </SelectTrigger>
                                <SelectContent>
                                    {upcomingMonths.map((month) => (
                                        <SelectItem
                                            key={month.id}
                                            className="cursor-pointer capitalize"
                                            value={month.value.toString()}
                                        >
                                            {month.name}
                                        </SelectItem>
                                    ))}
                                    <SelectItem
                                        className="cursor-pointer capitalize"
                                        value="custom"
                                    >
                                        Custom
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {
                                dateRangeSelector.show &&
                                <DatePickerWithRange
                                    dateRange={{ from: dateRangeSelector.startDate, to: dateRangeSelector.endDate }}
                                    onDateRangeChange={(date) => {
                                        setDateRangeSelector({
                                            ...dateRangeSelector,
                                            startDate: date?.from ?? new Date(),
                                            endDate: date?.to ?? new Date()
                                        })

                                        if (date?.from && date?.to) {
                                            changeFilter(AMC_FILTER.UPCOMING, {
                                                upcoming: 0,
                                                startDate: date.from.toISOString(),
                                                endDate: date.to.toISOString()
                                            })
                                        }
                                    }}
                                />
                            }
                        </div>
                    }

                    {
                        // Date Range Selector for non-upcoming filters
                        !showUpcomingMonthsFilter && activeFilter !== AMC_FILTER.UPCOMING &&
                        <div className="flex items-center gap-2">
                            <Typography variant="p">Date Range:</Typography>
                            <DatePickerWithRange
                                dateRange={{ from: dateRangeSelector.startDate, to: dateRangeSelector.endDate }}
                                onDateRangeChange={(date) => {
                                    setDateRangeSelector({
                                        ...dateRangeSelector,
                                        startDate: date?.from ?? new Date(),
                                        endDate: date?.to ?? new Date()
                                    })

                                    if (date?.from && date?.to) {
                                        changeFilter(activeFilter, {
                                            upcoming: 0,
                                            startDate: date.from.toISOString(),
                                            endDate: date.to.toISOString()
                                        })
                                    }
                                }}
                            />
                        </div>
                    }

                    <Select
                        value={activeFilter}
                        defaultValue={AMC_FILTER.UPCOMING}
                        onValueChange={(value: AMC_FILTER) => {
                            // reset all filters
                            table.resetColumnFilters()
                            setActiveFilter(value)

                            if (value === AMC_FILTER.UPCOMING) {
                                setShowUpcomingMonthsFilter(true)
                                changeFilter(value, { upcoming: 1 })
                            } else {
                                setShowUpcomingMonthsFilter(false)
                                // For any other filter, show the date range selector
                                setDateRangeSelector({
                                    show: true,
                                    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                                    endDate: new Date()
                                })
                                // Apply the filter with default date range (last year to now)
                                changeFilter(value, {
                                    upcoming: 0,
                                    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
                                    endDate: new Date().toISOString()
                                })
                            }
                        }}
                    >
                        <SelectTrigger className="w-[180px] capitalize">
                            <SelectValue placeholder="Select Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.values(AMC_FILTER).map((filter) => filter !== AMC_FILTER.OVERDUE && (
                                <SelectItem key={filter} className="cursor-pointer capitalize" value={filter}>
                                    {filter} AMC
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
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
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer"
                                    data-state={row.getIsSelected() && 'selected'}
                                    onClick={() => router.push(`/amc/${row.original.orderId}`)}
                                >
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

            <div className="flex items-center justify-end space-x-2 py-4">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                        </PaginationItem>
                        {Array.from({ length: pagination.pages }, (_, i) => (
                            <PaginationItem key={i + 1}>
                                <Button
                                    variant={currentPage === i + 1 ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => onPageChange(i + 1)}
                                    className="w-8"
                                >
                                    {i + 1}
                                </Button>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === pagination.pages}
                                className="gap-1"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
}

export default AMCList