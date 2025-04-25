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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

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
    initialFilters: {
        client?: string;
        product?: string;
        status?: string;
        purchaseType?: string;
        parentCompany?: string;
        amcPending: boolean;
        page: number;
    };
    onFilterChange: (filterType: 'client' | 'product' | 'status' | 'purchaseType' | 'parentCompany', value: string | undefined) => void;
    onAmcPendingChange: (value: boolean) => void;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

const PurchasesList: React.FC<IProps> = ({ 
    data, 
    pagination, 
    initialFilters,
    onFilterChange,
    onAmcPendingChange,
    onPageChange,
    isLoading 
}) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [purchasesData, setPurchasesData] = useState(data)
    const products = useAppSelector(state => state.user.products)

    // Set active tab state from initialFilters
    const [activeTabFilters, setActiveTabFilters] = useState({ 
        pending_amc_start_date: initialFilters.amcPending 
    })

    const router = useRouter()

    const [columnVisibility, setColumnVisibility] =
        useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    const searchParams = useSearchParams()
    const id = searchParams.get('id')

    // Apply initial data filters
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
    }, [activeTabFilters, data])

    useEffect(() => {
        // Hide parent_company column by default
        setColumnVisibility((prev) => ({ ...prev, parent_company: false }))
    }, [])

    // IMPORTANT: Create purchases data before table initialization
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

    // Now create the table after all data is prepared
    const table = useReactTable({
        data: purchases,
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
        initialState: {
            pagination: {
                pageIndex: initialFilters.page - 1, // Convert 1-based to 0-based index
                pageSize: pagination.limit
            }
        }
    })

    // Set initial table state from URL params after table is initialized
    useEffect(() => {
        if (!table) return; // Safety check
        
        if (initialFilters.client) {
            table.getColumn('client')?.setFilterValue(initialFilters.client)
        }
        if (initialFilters.product) {
            table.getColumn('products')?.setFilterValue(initialFilters.product)
        }
        if (initialFilters.status) {
            table.getColumn('status')?.setFilterValue(initialFilters.status)
        }
        if (initialFilters.purchaseType) {
            table.getColumn('purchaseType')?.setFilterValue(initialFilters.purchaseType)
        }
        if (initialFilters.parentCompany) {
            table.getColumn('parent_company')?.setFilterValue(initialFilters.parentCompany)
        }
        
        // Ensure page index is correctly set from initialFilters
        if (table.getState().pagination.pageIndex !== initialFilters.page - 1) {
            table.setPageIndex(initialFilters.page - 1);
        }
    }, [initialFilters, table])
    
    // Ensure table pagination state syncs with URL
    useEffect(() => {
        if (!table) return; // Safety check
        
        const pageFromUrl = initialFilters.page;
        const tablePageIndex = table.getState().pagination.pageIndex;
        
        // If URL page doesn't match table page, update table
        if (pageFromUrl - 1 !== tablePageIndex) {
            table.setPageIndex(pageFromUrl - 1);
        }
    }, [initialFilters.page, table]);

    const onTabFilterChange = (tab: keyof typeof activeTabFilters) => {
        const newValue = !activeTabFilters[tab];
        setActiveTabFilters((prev) => ({
            ...prev,
            [tab]: newValue,
        }));
        // Also call parent component callback
        if (tab === 'pending_amc_start_date') {
            onAmcPendingChange(newValue);
        }
    }
    

    return (
        <div>
            <div className="w-full">
                <div className="flex items-center justify-between py-4 flex-wrap gap-3">
                    <Input
                        placeholder="Filter companies..."
                        value={(table.getColumn('client')?.getFilterValue() as string) ?? ''}
                        onChange={(event) => {
                            const value = event.target.value
                            // Update local table state
                            table.getColumn('client')?.setFilterValue(value)
                            // Update parent state/URL
                            onFilterChange('client', value || undefined)
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
                                            // Update local table state
                                            table.getColumn('parent_company')?.setFilterValue(value ? parent : '')
                                            // Update parent state/URL
                                            onFilterChange('parentCompany', value ? parent : undefined)
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
                                                // Update local table state
                                                table.getColumn('client')?.setFilterValue(value ? client : '')
                                                // Update parent state/URL
                                                onFilterChange('client', value ? client : undefined)
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
                                            // Update local table state
                                            table.getColumn('status')?.setFilterValue(value ? status : '')
                                            // Update parent state/URL
                                            onFilterChange('status', value ? status : undefined)
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
                                            // Update local table state
                                            table.getColumn('purchaseType')?.setFilterValue(value ? type : '')
                                            // Update parent state/URL
                                            onFilterChange('purchaseType', value ? type : undefined)
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
                                                // Update local table state
                                                table.getColumn('products')?.setFilterValue(value ? product : '')
                                                // Update parent state/URL
                                                onFilterChange('product', value ? product : undefined)
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
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows?.length ? (
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
                
                {/* Display row count and pagination */}
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {table.getFilteredRowModel().rows.length} of {purchases.length} items
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                {table.getCanPreviousPage() ? (
                                    <PaginationPrevious 
                                        href="#" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const newPage = table.getState().pagination.pageIndex; // Current page index before change
                                            table.previousPage();
                                            onPageChange(newPage); // Use the page we're going to, not the one we came from
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
                            
                            {/* Calculate page numbers to display */}
                            {Array.from({ length: table.getPageCount() }).map((_, index) => {
                                // Show limited page numbers with ellipsis for better UX
                                const pageIndex = index;
                                const currentPage = table.getState().pagination.pageIndex;
                                
                                // Always show first, last, current and pages around current
                                if (
                                    pageIndex === 0 || 
                                    pageIndex === table.getPageCount() - 1 ||
                                    Math.abs(pageIndex - currentPage) <= 1
                                ) {
                                    return (
                                        <PaginationItem key={pageIndex}>
                                            <PaginationLink 
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    table.setPageIndex(pageIndex);
                                                    onPageChange(pageIndex + 1); // Convert 0-based to 1-based index
                                                }}
                                                isActive={currentPage === pageIndex}
                                            >
                                                {pageIndex + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                                
                                // Show ellipsis for skipped pages
                                if (
                                    (pageIndex === 1 && currentPage > 2) ||
                                    (pageIndex === table.getPageCount() - 2 && currentPage < table.getPageCount() - 3)
                                ) {
                                    return (
                                        <PaginationItem key={pageIndex}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }
                                
                                return null;
                            })}
                            
                            <PaginationItem>
                                {table.getCanNextPage() ? (
                                    <PaginationNext 
                                        href="#" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const newPageIndex = table.getState().pagination.pageIndex + 1; // Get next page index
                                            table.nextPage();
                                            onPageChange(newPageIndex + 1); // Convert from 0-based to 1-based and use the page we're going to
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

            </div>
        </div>
    )
}

export default PurchasesList
