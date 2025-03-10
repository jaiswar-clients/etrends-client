'use client'

import { useState, useMemo } from 'react'
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { GetAllClientResponse } from '@/redux/api/client'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/redux/hook'

interface IProps {
    data: GetAllClientResponse[]
}

interface ClientTableData {
    id: string;
    name: string;
    industry: string;
    products: string;
    dateJoined: Date;
    first_order_date: Date;
    parent_company: string | null;
}

export const columns: ColumnDef<ClientTableData>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'parent_company',
        header: 'Parent Company',
        cell: ({ row }) => <div className="capitalize">{row.getValue('parent_company') || '-'}</div>,
    },
    {
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ row }) => <div className="capitalize">{row.getValue('industry')}</div>,
    },
    {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }) => <div className="">{row.getValue('products')}</div>,
    },
    {
        accessorKey: 'dateJoined',
        header: 'Date Joined',
        cell: ({ row }) => {
            const date = row.getValue('dateJoined') as Date
            const formatted = date.toLocaleDateString()
            return <div>{formatted}</div>
        },
    },
    {
        accessorKey: 'first_order_date',
        header: 'First Purchase',
        cell: ({ row }) => {
            const date = row.getValue('first_order_date') as Date
            const formatted = date.toLocaleDateString()
            return <div>{formatted}</div>
        },
    }
]


const ClientList: React.FC<IProps> = ({ data: clientData }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const router = useRouter()
    const products = useAppSelector((state) => state.user.products)

    // Transform the data into the shape we need
    const data = useMemo(() =>
        clientData.map((client) => ({
            id: client._id,
            name: client.name,
            industry: client.industry,
            products: client.products.join(', '),
            dateJoined: new Date(client.createdAt),
            first_order_date: new Date(client.first_order_date),
            parent_company: client.parent_company || null
        }))
        , [clientData])

    const [columnVisibility, setColumnVisibility] =
        useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const uniqueClients = useMemo(
        () => Array.from(new Set(data.map((d) => d.name))),
        [data]
    )
    const uniqueProducts = useMemo(
        () => [...new Set(products.map((product) => product.short_name))],
        [products]
    )

    const uniqueIndustries = useMemo(
        () => Array.from(new Set(data.map((d) => d.industry))),
        [data]
    )

    const uniqueParentCompanies = useMemo(
        () => Array.from(new Set(clientData.map((d) => d.parent_company).filter(Boolean))),
        [clientData]
    )

    const table = useReactTable({
        data,
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
        <div className="w-full">
            <div className="flex items-center justify-between py-4 flex-wrap gap-3">
                <Input
                    placeholder="Filter companies..."
                    value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => {
                        const value = event.target.value;
                        table.getColumn('name')?.setFilterValue(value);
                    }}
                    className="max-w-sm"
                />
                <div className="flex item-center gap-4">
                    {/* Parent Company Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto capitalize">
                                {(table.getColumn('parent_company')?.getFilterValue() as string) || 'Parent'} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueParentCompanies.map((parent) => (
                                <DropdownMenuCheckboxItem
                                    key={parent}
                                    className="capitalize"
                                    checked={table.getColumn('parent_company')?.getFilterValue() === parent}
                                    onCheckedChange={(value) => {
                                        table.getColumn('parent_company')?.setFilterValue(value ? parent : '')
                                    }}
                                >
                                    {parent}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clients Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                {(table.getColumn('name')?.getFilterValue() as string) ?? 'Client'}{' '}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueClients.map((client) => (
                                <DropdownMenuCheckboxItem
                                    key={client}
                                    className="capitalize"
                                    checked={
                                        table.getColumn('name')?.getFilterValue() === client
                                    }
                                    onCheckedChange={(value) => {
                                        table
                                            .getColumn('name')
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
                                {(table.getColumn('products')?.getFilterValue() as string) ?? 'Products'}{' '}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueProducts.map((product) => (
                                <DropdownMenuCheckboxItem
                                    key={product}
                                    className="capitalize"
                                    checked={table.getColumn('products')?.getFilterValue() === product}
                                    onCheckedChange={(value) => {
                                        table.getColumn('products')?.setFilterValue(value ? product : '')
                                    }}
                                >
                                    {product}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Industry Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto capitalize">
                                {(table.getColumn('industry')?.getFilterValue() as string) ?? 'Industry'}{' '}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueIndustries.map((industry) => (
                                <DropdownMenuCheckboxItem
                                    key={industry}
                                    className="capitalize"
                                    checked={table.getColumn('industry')?.getFilterValue() === industry}
                                    onCheckedChange={(value) => {
                                        table.getColumn('industry')?.setFilterValue(value ? industry : '')
                                    }}
                                >
                                    {industry}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    onClick={() => router.push(`/clients/${row.original.id}`)}
                                    className='cursor-pointer'
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
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

export default ClientList