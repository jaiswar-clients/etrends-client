'use client'

import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
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
import { ArrowUpDown, ChevronDown, Clipboard, MoreHorizontal, Trash } from 'lucide-react'
import { Badge } from '../ui/badge'
import { IProduct } from '@/types/product'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface IProps {
    products: IProduct[]
    deleteProduct: (id: string) => void
}

const ProductList: React.FC<IProps> = ({ products, deleteProduct }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const router = useRouter()

    const columns: ColumnDef<IProduct>[] = useMemo(
        () => [
            {
                accessorKey: 'name',
                header: ({ column }: { column: any }) => {
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
                cell: ({ row }: { row: any }) => <div>{row.getValue('name')}</div>,
            },
            {
                accessorKey: 'short_name',
                header: 'Short Name',
                cell: ({ row }: { row: any }) => <div>{row.getValue('short_name')}</div>,
            },
            {
                accessorKey: 'does_have_license',
                header: 'License Required',
                cell: ({ row }: { row: any }) => {
                    const hasLicense = row.getValue('does_have_license') as boolean
                    return (
                        <Badge variant={hasLicense ? 'default' : 'secondary'}>
                            {hasLicense ? 'Yes' : 'No'}
                        </Badge>
                    )
                },
            },
            {
                accessorKey: 'description',
                header: 'Description',
                cell: ({ row }: { row: any }) => <div>{row.getValue('description')}</div>,
            },
            {
                id: 'actions',
                enableHiding: false,
                cell: ({ row }: { row: any }) => {
                    const product = row.original

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                    onClick={() => navigator.clipboard.writeText(product._id)}
                                    className='flex justify-start'
                                >
                                    <Clipboard />
                                    Copy product ID
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => deleteProduct(product._id)}
                                    className='hover:!bg-red-600 hover:!text-white cursor-pointer flex !justify-start'
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete Product
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                },
            },
        ],
        [deleteProduct]
    )

    const table = useReactTable({
        data: products,
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
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter products..."
                    value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('name')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
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
                                    className='cursor-pointer'
                                    data-state={row.getIsSelected() && 'selected'}
                                    onClick={() => router.push(`/products/${row.original._id}`)}
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
            {/* Table Footer - Items Info & Pagination */}
            <div className="flex items-center justify-between py-4 border-t">
                {/* Items Count Display */}
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length > 0 ? (
                        <>
                            <span className="font-medium text-foreground">
                                {table.getFilteredSelectedRowModel().rows.length}
                            </span>
                            <span className="mx-2">of</span>
                            <span className="font-medium text-foreground">
                                {table.getFilteredRowModel().rows.length}
                            </span>
                            <span className="ml-1">row(s) selected</span>
                        </>
                    ) : (
                        <>
                            <span className="font-medium text-foreground">
                                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-{Math.min(
                                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                    table.getFilteredRowModel().rows.length
                                )}
                            </span>
                            <span className="mx-2">of</span>
                            <span className="font-medium text-foreground">
                                {table.getFilteredRowModel().rows.length}
                            </span>
                            <span className="ml-1">items</span>
                        </>
                    )}
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-4">
                    <div className="flex items-baseline gap-1 text-sm">
                        <span className="text-muted-foreground">Page</span>
                        <span className="font-medium">
                            {table.getState().pagination.pageIndex + 1}
                        </span>
                        <span className="text-muted-foreground">
                            of {table.getPageCount()}
                        </span>
                    </div>
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
        </div>
    )
}

export default ProductList