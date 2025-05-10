'use client'

import {
    ColumnDef,
} from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { IPurchase, PURCHASE_TYPE } from '@/types/order'
import { ORDER_STATUS_ENUM } from '@/types/client'
import { useState, useMemo } from 'react'
import { Input } from '../ui/input'
import { useRouter } from 'next/navigation'
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
import { DataTable } from '../ui/data-table'
import { useGetOrderFiltersOfCompanyQuery } from '@/redux/api/order'
import FinancialYearFilter from '../common/FinancialYearFilter'

const columns = (router: ReturnType<typeof useRouter>): ColumnDef<IPurchase>[] => [
    {
        accessorKey: 'client_id.name',
        header: 'Client',
        cell: ({ row }) => row.original.client_id.name
    },
    {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }) => {
            const products = row.original.products.map(p => p.short_name).join(', ')
            return products
        }
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
        accessorKey: 'client_id.parent_company.name',
        header: 'Parent Company',
        cell: ({ row }) => row.original.client_id.parent_company?.name || 'N/A'
    },
    {
        id: 'actions',
        header: "Actions",
        cell: ({ row }) => {
            const purchase = row.original
            return (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent row click toggle
                        router.push(`/purchases/${purchase._id}?type=${PURCHASE_TYPE.ORDER}&client=${purchase.client_id._id}`)
                    }}
                >
                    View
                </Button>
            )
        }
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
        clientId?: string;
        product?: string;
        status?: string;
        purchaseType?: string;
        parentCompany?: string;
        parentCompanyId?: string;
        amcPending: boolean;
        page: number;
        fy?: string;
        startDate?: string;
        endDate?: string;
    };
    onFilterChange: (filterType: 'client' | 'product' | 'status' | 'purchaseType' | 'parentCompany' | 'clientId' | 'parentCompanyId', value: string | undefined) => void;
    onAmcPendingChange: (value: boolean) => void;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    selectedFY?: string;
    onFYFilterChange: (fy: string | undefined) => void;
    onCustomDateChange: (startDate: string, endDate: string) => void;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
}

const PurchasesList: React.FC<IProps> = ({
    data,
    pagination,
    initialFilters,
    onFilterChange,
    onAmcPendingChange,
    onPageChange,
    isLoading,
    selectedFY,
    onFYFilterChange,
    onCustomDateChange,
    dateRange
}) => {
    const products = useAppSelector(state => state.user.products)
    const { data: filtersData } = useGetOrderFiltersOfCompanyQuery()
    const [clientSearch, setClientSearch] = useState("")
    const [parentSearch, setParentSearch] = useState("")

    // Set active tab state from initialFilters
    const [activeTabFilters, setActiveTabFilters] = useState({
        pending_amc_start_date: initialFilters.amcPending
    })

    const router = useRouter()

    // Get unique values for status and product filters
    const uniqueStatus = useMemo(
        () => Array.from(new Set(data.map((d) => d.status))),
        [data]
    )

    const uniqueProducts = useMemo(
        () => [...new Set(products.map((product: any) => product.short_name))],
        [products]
    )

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

    const handleClientSelection = (clientName: string | undefined, clientId: string | undefined) => {
        onFilterChange('client', clientName);
        onFilterChange('clientId', clientId);
        setClientSearch("");
    }

    const handleParentCompanySelection = (parentName: string | undefined, parentId: string | undefined) => {
        onFilterChange('parentCompany', parentName);
        onFilterChange('parentCompanyId', parentId);
        setParentSearch("");
    }

    const tableColumns = useMemo(() => columns(router), [router]);

    // Filter client and parent lists based on search
    const filteredClients = useMemo(() => {
        if (!filtersData?.data?.clients) return [];
        return filtersData.data.clients.filter(client =>
            client.name.toLowerCase().includes(clientSearch.toLowerCase())
        );
    }, [filtersData?.data?.clients, clientSearch]);

    const filteredParents = useMemo(() => {
        if (!filtersData?.data?.parents) return [];
        return filtersData.data.parents.filter(parent =>
            parent.name.toLowerCase().includes(parentSearch.toLowerCase())
        );
    }, [filtersData?.data?.parents, parentSearch]);

    return (
        <div>
            <div className="w-full">
                <div className="flex items-center justify-between py-4 flex-wrap gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {/* Financial Year Filter */}
                        <FinancialYearFilter
                            selectedFY={selectedFY}
                            onFYFilterChange={onFYFilterChange}
                            onCustomDateChange={onCustomDateChange}
                            dateRange={dateRange}
                            buttonLabel="Financial Year"
                        />

                        {/* Client Filter */}
                        <div className="relative">
                            {initialFilters.client ? (
                                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                                    <span className="text-sm font-medium">{initialFilters.client}</span>
                                    <button
                                        onClick={() => handleClientSelection(undefined, undefined)}
                                        className="ml-1 text-gray-500 hover:text-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="capitalize min-w-[120px]">
                                            Client <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[250px]">
                                        <div className="px-2 py-2">
                                            <Input
                                                placeholder="Search clients..."
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map((client) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={client._id}
                                                        className="capitalize"
                                                        checked={initialFilters.clientId === client._id}
                                                        onCheckedChange={(value) => {
                                                            handleClientSelection(value ? client.name : undefined, value ? client._id : undefined);
                                                        }}
                                                    >
                                                        {client.name}
                                                    </DropdownMenuCheckboxItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-2 text-sm text-gray-500">No clients found</div>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {/* Parent Company Filter */}
                        <div className="relative">
                            {initialFilters.parentCompany ? (
                                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                                    <span className="text-sm font-medium">{initialFilters.parentCompany}</span>
                                    <button
                                        onClick={() => handleParentCompanySelection(undefined, undefined)}
                                        className="ml-1 text-gray-500 hover:text-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="capitalize min-w-[120px]">
                                            Parent <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[250px]">
                                        <div className="px-2 py-2">
                                            <Input
                                                placeholder="Search parent companies..."
                                                value={parentSearch}
                                                onChange={(e) => setParentSearch(e.target.value)}
                                                className="mb-2"
                                            />
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {filteredParents.length > 0 ? (
                                                filteredParents.map((parent) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={parent._id}
                                                        className="capitalize"
                                                        checked={initialFilters.parentCompanyId === parent._id}
                                                        onCheckedChange={(value) => {
                                                            handleParentCompanySelection(value ? parent.name : undefined, value ? parent._id : undefined);
                                                        }}
                                                    >
                                                        {parent.name}
                                                    </DropdownMenuCheckboxItem>
                                                ))
                                            ) : (
                                                <div className="px-2 py-2 text-sm text-gray-500">No parent companies found</div>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Status Filter */}
                        <div className="relative">
                            {initialFilters.status ? (
                                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                                    <span className="text-sm font-medium capitalize">{initialFilters.status}</span>
                                    <button
                                        onClick={() => onFilterChange('status', undefined)}
                                        className="ml-1 text-gray-500 hover:text-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="capitalize min-w-[120px]">
                                            Status <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {uniqueStatus.map((status) => (
                                            <DropdownMenuCheckboxItem
                                                key={status}
                                                className="capitalize"
                                                checked={initialFilters.status === status}
                                                onCheckedChange={(value) => {
                                                    onFilterChange('status', value ? status : undefined)
                                                }}
                                            >
                                                {status}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {/* Products Filter */}
                        <div className="relative">
                            {initialFilters.product ? (
                                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                                    <span className="text-sm font-medium">{initialFilters.product}</span>
                                    <button
                                        onClick={() => onFilterChange('product', undefined)}
                                        className="ml-1 text-gray-500 hover:text-gray-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="capitalize min-w-[120px]">
                                            Products <ChevronDown className="ml-2 h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {uniqueProducts.map((product: string) => (
                                            <DropdownMenuCheckboxItem
                                                key={product}
                                                className="capitalize"
                                                checked={initialFilters.product === product}
                                                onCheckedChange={(value) => {
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
                </div>
                <div className="flex mb-2">
                    <Button className='rounded-full !py-1 h-auto' variant={activeTabFilters.pending_amc_start_date ? "secondary" : "outline"} size={"sm"} onClick={() => {
                        onTabFilterChange('pending_amc_start_date')
                    }}>
                        <span className='text-xs'>AMC Start Date Pending</span>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <DataTable
                        columns={tableColumns}
                        data={data}
                    />
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-muted-foreground">
                        Showing {Math.min(pagination.limit, data.length)} of {pagination.total} items
                    </div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (initialFilters.page > 1) {
                                            onPageChange(initialFilters.page - 1);
                                        }
                                    }}
                                    className={initialFilters.page <= 1 ? "opacity-50 cursor-not-allowed" : ""}
                                />
                            </PaginationItem>

                            {/* Calculate page numbers to display */}
                            {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }).map((_, index) => {
                                const pageNumber = index + 1;
                                const currentPage = initialFilters.page;

                                // Always show first, last, current and pages around current
                                if (
                                    pageNumber === 1 ||
                                    pageNumber === Math.ceil(pagination.total / pagination.limit) ||
                                    Math.abs(pageNumber - currentPage) <= 1
                                ) {
                                    return (
                                        <PaginationItem key={pageNumber}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onPageChange(pageNumber);
                                                }}
                                                isActive={currentPage === pageNumber}
                                            >
                                                {pageNumber}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }

                                // Show ellipsis for skipped pages
                                if (
                                    (pageNumber === 2 && currentPage > 3) ||
                                    (pageNumber === Math.ceil(pagination.total / pagination.limit) - 1 && currentPage < Math.ceil(pagination.total / pagination.limit) - 2)
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
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (initialFilters.page < Math.ceil(pagination.total / pagination.limit)) {
                                            onPageChange(initialFilters.page + 1);
                                        }
                                    }}
                                    className={initialFilters.page >= Math.ceil(pagination.total / pagination.limit) ? "opacity-50 cursor-not-allowed" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    )
}

export default PurchasesList
