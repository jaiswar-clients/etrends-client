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
import { ChevronDown } from 'lucide-react'
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
    data: TransformedAMCObject[]
    changeFilter: (filter: AMC_FILTER, options?: { upcoming: number }) => void
}

type TableData = {
    id: string;
    client: string;
    order: string;
    status: string;
    due_date: string;
    orderId: string
    amount: number
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
        header: 'Due Date',
    },
]

const AMCList: React.FC<IProps> = ({ data, changeFilter }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const [showUpcomingMonthsFilter, setShowUpcomingMonthsFilter] = useState(true)

    const router = useRouter()

    const products = useAppSelector((state) => state.user.products)

    const tableData = useMemo(() => {
        return data.map((d) => ({
            id: d._id,
            client: d.client.name,
            order: d.products.map((p) => p.short_name).join(', '),
            status: d.last_payment?.status || '',
            due_date: new Date(d.last_payment?.to_date ?? '').toLocaleDateString(),
            orderId: d.order?._id,
            amount: d.amount
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
    })

    return (
        <div>
            <Typography variant="h1">AMC List</Typography>
            <div className="flex items-center justify-between py-4">
                <Input
                    placeholder="Filter clients..."
                    value={(table.getColumn('client')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('client')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <div className="flex item-center gap-4">
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
                        <Select defaultValue={'1'} onValueChange={(value: string) => {
                            changeFilter(AMC_FILTER.UPCOMING, { upcoming: Number(value) })
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
                                        onClick={() => changeFilter(AMC_FILTER.UPCOMING, { upcoming: month.value })}
                                    >
                                        {month.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    }
                    <Select
                        defaultValue={AMC_FILTER.UPCOMING}
                        onValueChange={(value: AMC_FILTER) => {
                            // reset all filters
                            table.resetColumnFilters()
                            changeFilter(value)
                            if (value === AMC_FILTER.UPCOMING) {
                                setShowUpcomingMonthsFilter(true)
                            } else {
                                setShowUpcomingMonthsFilter(false)
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
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default AMCList