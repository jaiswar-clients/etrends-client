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
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { IPurchase, PURCHASE_TYPE } from '@/types/order'
import { ORDER_STATUS_ENUM } from '@/types/client'
import { useState, useMemo, useEffect } from 'react'
import { Input } from '../ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppSelector } from '@/redux/hook'

type Purchase = {
    id: string
    client: string
    purchaseType: PURCHASE_TYPE
    products: string
    status: string
    client_id: string
}

const columns: ColumnDef<Purchase>[] = [
    {
        accessorKey: 'client',
        header: 'Client',
    },
    {
        accessorKey: 'purchaseType',
        header: 'Purchase Type',
    },
    {
        accessorKey: 'products',
        header: 'Products',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string
            return (
                <Badge variant={status === ORDER_STATUS_ENUM.ACTIVE ? 'success' : status === ORDER_STATUS_ENUM.INACTIVE ? 'destructive' : 'default'}>
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: 'parent_company',
        header: 'Parent Company',
        enableHiding: true,
    }
]

interface IProps {
    data: IPurchase[],
    pagination: {
        total: number,
        page: number,
        limit: number
    }

}

const PurchasesList: React.FC<IProps> = ({ data }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        []
    )
    const [purchasesData, setPurchasesData] = useState(data)
    const products = useAppSelector(state => state.user.products)

    const [activeTabFilters, setActiveTabFilters] = useState({ pending_amc_start_date: false })

    const router = useRouter()

    const [columnVisibility, setColumnVisibility] =
        useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    useEffect(() => {
        if (data) {
            const filteredData = id
                ? data.filter(purchase => purchase.id === id)
                : data;
            setPurchasesData(filteredData);
        }
    }, [data, id]);

    useEffect(() => {
        if (activeTabFilters.pending_amc_start_date) {
            const filteredData = data.filter(purchase => purchase.amc_start_date === null)
            setPurchasesData(filteredData)
        } else {
            setPurchasesData(data)
        }
    }, [activeTabFilters])

    useEffect(() => {
        // Hide parent_company column by default
        setColumnVisibility((prev) => ({ ...prev, parent_company: false }))
    }, [])

    const purchases = useMemo(() =>
        purchasesData.map((purchase) => ({
            id: purchase.id,
            client: purchase.client.name,
            purchaseType: purchase.purchase_type,
            products: purchase.products.map((product) => product.short_name).join(', '),
            status: purchase.status,
            client_id: purchase.client._id,
            amc_start_date: purchase?.amc_start_date,
            parent_company: purchase?.client?.parent_company?.name || null

        })) ?? []
        , [purchasesData])


    // Extract unique clients and products
    const uniqueClients = useMemo(
        () => Array.from(new Set(purchasesData.map((d) => d.client.name))),
        [purchasesData]
    )
    const uniqueProducts = useMemo(
        () => [...new Set(products.map((product) => product.short_name))],
        [products]
    )

    const uniquePurchaseTypes = useMemo(
        () => Array.from(new Set(purchasesData.map((d) => d.purchase_type))),
        [purchasesData]
    )

    const uniqueStatus = useMemo(
        () => Array.from(new Set(purchasesData.map((d) => d.status))),
        [purchasesData]
    )

    const uniqueParentCompanies = useMemo(
        () => Array.from(new Set(purchasesData.map((d) => d?.client?.parent_company?.name).filter(Boolean))),
        [purchasesData]
    )


    const table = useReactTable({
        data: purchases ?? [],
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

    const onTabFilterChange = (tab: keyof typeof activeTabFilters) => {
        setActiveTabFilters((prev) => ({
            ...prev,
            [tab]: !prev[tab],
        }))
    }

    return (
        <div>
            <div className="w-full">
                <div className="flex items-center justify-between py-4">
                    <Input
                        placeholder="Filter companies..."
                        value={(table.getColumn('client')?.getFilterValue() as string) ?? ''}
                        onChange={(event) => {
                            const value = event.target.value
                            table.getColumn('client')?.setFilterValue(value)
                        }}
                        className="max-w-sm"
                    />
                    <div className="flex item-center gap-4">
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
                        {!table.getColumn('products')?.getFilterValue() && (
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

                        )}
                        {/* Create DropDowndown filter for Status and Order Type */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto capitalize">
                                    {(table.getColumn('status')?.getFilterValue() as string) || 'Status'} <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {uniqueStatus.map((status) => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        className="capitalize"
                                        checked={table.getColumn('status')?.getFilterValue() === status}
                                        onCheckedChange={(value) => {
                                            table.getColumn('status')?.setFilterValue(value ? status : '')
                                        }}
                                    >
                                        {status}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="ml-auto capitalize">
                                    {(table.getColumn('purchaseType')?.getFilterValue() as string) || 'Purchase Type'} <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {uniquePurchaseTypes.map((type) => (
                                    <DropdownMenuCheckboxItem
                                        key={type}
                                        className="capitalize"
                                        checked={table.getColumn('purchaseType')?.getFilterValue() === type}
                                        onCheckedChange={(value) => {
                                            table.getColumn('purchaseType')?.setFilterValue(value ? type : '')
                                        }}
                                    >
                                        {type}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>



                        {/* Products Dropdown */}
                        {!table.getColumn('client')?.getFilterValue() && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="ml-auto ">
                                        {(table.getColumn('products')?.getFilterValue() as string) || 'Products'} <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {uniqueProducts.map((product) => (
                                        <DropdownMenuCheckboxItem
                                            key={product}
                                            className="capitalize"
                                            checked={
                                                table.getColumn('products')?.getFilterValue() === product
                                            }
                                            onCheckedChange={(value) => {
                                                table
                                                    .getColumn('products')
                                                    ?.setFilterValue(value ? product : '')
                                            }}
                                        >
                                            {product}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
                <div className="flex mb-2">
                    <Button className='rounded-full !py-1 h-auto' variant={activeTabFilters.pending_amc_start_date ? "secondary" : "outline"} size={"sm"} onClick={() => {
                        onTabFilterChange('pending_amc_start_date')
                    }}>
                        <span className='text-xs'>AMC Start Date Pending</span>
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
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && 'selected'}
                                        onClick={() => router.push(`/purchases/${row.original.id}?type=${row.original.purchaseType}&client=${row.original.client_id}`)}
                                        className='cursor-pointer'
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
                {/* Add next prev button */}
                <div className="flex items-center justify-end space-x-2 py-4">
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

                {/* <div className="p-4">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={() => table.previousPage()}
                                />
                            </PaginationItem>
                            {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href={`/purchases?page=${i + 1}`}
                                        onClick={() => table.setPageIndex(i)}
                                        isActive={pagination.page === i + 1}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={() => table.nextPage()}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div> */}

            </div>
        </div>
    )
}

export default PurchasesList
