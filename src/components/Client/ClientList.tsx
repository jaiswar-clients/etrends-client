'use client'

import { useState, useMemo, useEffect } from 'react'
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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { GetAllClientResponse } from '@/redux/api/client'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/redux/hook'

interface IProps {
    data: GetAllClientResponse[]
    initialFilters: {
        client?: string;
        product?: string;
        industry?: string;
        parentCompany?: string;
        page: number;
    };
    onFilterChange: (filterType: 'client' | 'product' | 'industry' | 'parentCompany', value: string | undefined) => void;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
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

const ClientList: React.FC<IProps> = ({ 
    data: clientData, 
    initialFilters,
    onFilterChange,
    onPageChange,
    isLoading 
}) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const router = useRouter()
    const products = useAppSelector((state) => state.user.products)

    // State for column visibility
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})

    // FIRST: Transform the data into the shape we need
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

    // SECOND: Extract all filter data needed for the dropdowns
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

    // THIRD: Now that we have all the data, create the table
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
        initialState: {
            pagination: {
                pageIndex: initialFilters.page - 1, // Convert 1-based to 0-based index
                pageSize: 10 // Assuming fixed page size
            }
        }
    })

    // FOURTH: Set initial table state from URL params
    useEffect(() => {
        if (!table) return; // Safety check
        
        if (initialFilters.client) {
            table.getColumn('name')?.setFilterValue(initialFilters.client)
        }
        if (initialFilters.product) {
            table.getColumn('products')?.setFilterValue(initialFilters.product)
        }
        if (initialFilters.industry) {
            table.getColumn('industry')?.setFilterValue(initialFilters.industry)
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

    return (
        <div className="w-full">
            <div className="flex items-center justify-between py-4 flex-wrap gap-3">
                <Input
                    placeholder="Filter companies..."
                    value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => {
                        const value = event.target.value;
                        // Update local table state
                        table.getColumn('name')?.setFilterValue(value);
                        // Update parent state/URL
                        onFilterChange('client', value || undefined);
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
                                        // Update local table state
                                        table.getColumn('name')?.setFilterValue(value ? client : '')
                                        // Update parent state/URL
                                        onFilterChange('client', value ? client : undefined)
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
                                        // Update local table state
                                        table.getColumn('industry')?.setFilterValue(value ? industry : '')
                                        // Update parent state/URL
                                        onFilterChange('industry', value ? industry : undefined)
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
            {/* Display row count and pagination */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {table.getFilteredRowModel().rows.length} of {data.length} items
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
    )
}

export default ClientList