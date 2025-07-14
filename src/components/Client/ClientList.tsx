'use client'

import { useState, useMemo } from 'react'
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
import { Input } from '@/components/ui/input'
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
import { DataTable } from '../ui/data-table'
import FinancialYearFilter from '../common/FinancialYearFilter'
import { useGetOrderFiltersOfCompanyQuery } from '@/redux/api/order'

interface IProps {
    data: GetAllClientResponse[]
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
    initialFilters: {
        client?: string;
        clientId?: string;
        product?: string;
        productId?: string;
        industry?: string;
        parentCompany?: string;
        parentCompanyId?: string;
        hasOrders: boolean;
        page: number;
        fy?: string;
        startDate?: string;
        endDate?: string;
    };
    onFilterChange: (filterType: 'client' | 'product' | 'industry' | 'parentCompany' | 'clientId' | 'productId' | 'parentCompanyId', value: string | undefined) => void;
    onHasOrdersChange: (value: boolean) => void;
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

const columns = (router: ReturnType<typeof useRouter>): ColumnDef<GetAllClientResponse>[] => [
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <div>{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'parent_company',
        header: 'Parent Company',
        cell: ({ row }) => <div className="capitalize">{row.original.parent_company || '-'}</div>,
    },
    {
        accessorKey: 'industry',
        header: 'Industry',
        cell: ({ row }) => <div className="capitalize">{row.getValue('industry')}</div>,
    },
    {
        accessorKey: 'products',
        header: 'Products',
        cell: ({ row }) => <div className="">{row.original.products.join(', ')}</div>,
    },
    {
        accessorKey: 'createdAt',
        header: 'Date Joined',
        cell: ({ row }) => {
            const date = new Date(row.getValue('createdAt') as string)
            const formatted = date.toLocaleDateString()
            return <div>{formatted}</div>
        },
    },
    {
        accessorKey: 'first_order_date',
        header: 'First Purchase',
        cell: ({ row }) => {
            const date = new Date(row.getValue('first_order_date') as string)
            const formatted = date.toLocaleDateString()
            return <div>{formatted}</div>
        },
    },
    {
        id: 'actions',
        header: "Actions",
        cell: ({ row }) => {
            const client = row.original
            return (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/clients/${client._id}`)
                    }}
                >
                    View
                </Button>
            )
        }
    }
]

const ClientList: React.FC<IProps> = ({ 
    data, 
    pagination,
    initialFilters,
    onFilterChange,
    onHasOrdersChange,
    onPageChange,
    isLoading,
    selectedFY,
    onFYFilterChange,
    onCustomDateChange,
    dateRange
}) => {
    const products = useAppSelector((state) => state.user.products)
    const { data: filtersData } = useGetOrderFiltersOfCompanyQuery()
    const [clientSearch, setClientSearch] = useState("")
    const [parentSearch, setParentSearch] = useState("")

    // Set active tab state from initialFilters
    const [activeTabFilters, setActiveTabFilters] = useState({
        has_orders: initialFilters.hasOrders
    })

    const router = useRouter()

    // Get unique values for industry filters
    const uniqueIndustries = useMemo(
        () => Array.from(new Set(data.map((d) => d.industry))),
        [data]
    )

    const uniqueProducts = useMemo(() => {
        const productMap = new Map();
        products.forEach((product: any) => {
            if (!productMap.has(product.short_name)) {
                productMap.set(product.short_name, product);
            }
        });
        return Array.from(productMap.values());
    }, [products]);


    const onTabFilterChange = (tab: keyof typeof activeTabFilters) => {
        const newValue = !activeTabFilters[tab];
        setActiveTabFilters((prev) => ({
            ...prev,
            [tab]: newValue,
        }));
        // Also call parent component callback
        if (tab === 'has_orders') {
            onHasOrdersChange(newValue);
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
    
    const handleProductSelection = (productName: string | undefined) => {
        onFilterChange('product', productName);
        onFilterChange('productId', productName);
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
                    {/* Industry Filter */}
                    <div className="relative">
                        {initialFilters.industry ? (
                            <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                                <span className="text-sm font-medium capitalize">{initialFilters.industry}</span>
                                <button
                                    onClick={() => onFilterChange('industry', undefined)}
                                    className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="capitalize min-w-[120px]">
                                        Industry <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {uniqueIndustries.map((industry) => (
                                        <DropdownMenuCheckboxItem
                                            key={industry}
                                            className="capitalize"
                                            checked={initialFilters.industry === industry}
                                            onCheckedChange={(value) => {
                                                onFilterChange('industry', value ? industry : undefined)
                                            }}
                                        >
                                            {industry}
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
                                    onClick={() => handleProductSelection(undefined)}
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
                                    {uniqueProducts.map((product: any) => (
                                        <DropdownMenuCheckboxItem
                                            key={product._id}
                                            className="capitalize"
                                            checked={initialFilters.productId === product._id}
                                            onCheckedChange={(value) => {
                                                handleProductSelection(value ? product.short_name : undefined)
                                            }}
                                        >
                                            {product.short_name}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex mb-2">
                <Button 
                    className='rounded-full !py-1 h-auto' 
                    variant={activeTabFilters.has_orders ? "secondary" : "outline"} 
                    size={"sm"} 
                    onClick={() => {
                        onTabFilterChange('has_orders')
                    }}
                >
                    <span className='text-xs'>Has Orders</span>
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
                        {Array.from({ length: pagination.pages }).map((_, index) => {
                            const pageNumber = index + 1;
                            const currentPage = initialFilters.page;

                            // Always show first, last, current and pages around current
                            if (
                                pageNumber === 1 ||
                                pageNumber === pagination.pages ||
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
                                (pageNumber === pagination.pages - 1 && currentPage < pagination.pages - 2)
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
                                    if (initialFilters.page < pagination.pages) {
                                        onPageChange(initialFilters.page + 1);
                                    }
                                }}
                                className={initialFilters.page >= pagination.pages ? "opacity-50 cursor-not-allowed" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
}

export default ClientList