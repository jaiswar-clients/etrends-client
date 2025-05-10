"use client"
import React, { useState, useEffect } from 'react'
import Typography from '../ui/Typography'
import { Button } from '../ui/button'
import { Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGetClientsQuery } from '@/redux/api/client'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import PurchasesList from './PurchasesList'
import { useGetAllOrdersWithAttributesQuery } from '@/redux/api/order'

const dropdownItems = [
    { href: '/purchases/new/order', label: 'Order' },
    { href: '/purchases/new/license', label: 'Licenses' },
    { href: '/purchases/new/customization', label: 'Customization' },
    { href: '/purchases/new/additional-service', label: 'Additional Services' }
]

interface IProps {
    page?: number
}

const Purchase: React.FC<IProps> = ({ page: initialPage }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<typeof dropdownItems[0] | null>(null)
    const [selectedClientId, setSelectedClientId] = useState<string>('')
    
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
    // Create function to update URL query params
    const createQueryString = (params: Record<string, string | number | undefined>) => {
        const newSearchParams = new URLSearchParams(searchParams?.toString())
        for (const [key, value] of Object.entries(params)) {
            if (value === undefined || value === null || value === '') {
                newSearchParams.delete(key)
            } else {
                newSearchParams.set(key, String(value))
            }
        }
        return newSearchParams.toString()
    }

    // Get initial filter values from URL
    const [queryArgs, setQueryArgs] = useState(() => {
        const initialClientFilter = searchParams?.get('client')
        const initialClientIdFilter = searchParams?.get('clientId')
        const initialProductFilter = searchParams?.get('product')
        const initialStatusFilter = searchParams?.get('status')
        const initialPurchaseTypeFilter = searchParams?.get('purchaseType')
        const initialParentCompanyFilter = searchParams?.get('parentCompany')
        const initialParentCompanyIdFilter = searchParams?.get('parentCompanyId')
        const initialAmcPendingFilter = searchParams?.get('amcPending') === 'true'
        const initialFY = searchParams?.get('fy')
        const initialStartDate = searchParams?.get('startDate')
        const initialEndDate = searchParams?.get('endDate')
        const urlPage = searchParams?.get('page')
        
        return {
            client: initialClientFilter || undefined,
            clientId: initialClientIdFilter || undefined,
            product: initialProductFilter || undefined,
            status: initialStatusFilter || undefined,
            purchaseType: initialPurchaseTypeFilter || undefined,
            parentCompany: initialParentCompanyFilter || undefined,
            parentCompanyId: initialParentCompanyIdFilter || undefined,
            amcPending: initialAmcPendingFilter,
            fy: initialFY || undefined,
            startDate: initialStartDate || undefined,
            endDate: initialEndDate || undefined,
            page: urlPage ? parseInt(urlPage) : (initialPage || 1)
        }
    })

    // Prepare filters for API query
    const { data, refetch, isFetching } = useGetAllOrdersWithAttributesQuery({ 
        page: queryArgs.page,
        limit: 10, // Assuming a default limit or get it from queryArgs if available
        parent_company_id: queryArgs.parentCompanyId,
        client_id: queryArgs.clientId,
        client_name: queryArgs.client,
        product_id: queryArgs.product,
        status: queryArgs.status as any, // Keep as any if ORDER_STATUS_ENUM is handled by the hook
        startDate: queryArgs.startDate,
        endDate: queryArgs.endDate
    })
    const { data: clientsList } = useGetClientsQuery({ all: true })

    // Effect to update URL when queryArgs change
    useEffect(() => {
        const queryString = createQueryString({
            client: queryArgs.client,
            clientId: queryArgs.clientId,
            product: queryArgs.product,
            status: queryArgs.status,
            purchaseType: queryArgs.purchaseType,
            parentCompany: queryArgs.parentCompany,
            parentCompanyId: queryArgs.parentCompanyId,
            amcPending: queryArgs.amcPending ? 'true' : undefined,
            fy: queryArgs.fy,
            startDate: queryArgs.startDate,
            endDate: queryArgs.endDate,
            page: queryArgs.page
        })
        
        // Use replace to avoid adding duplicate entries to history
        router.replace(`${pathname}?${queryString}`, { scroll: false })
    }, [queryArgs, router, pathname])
    
    // Effect to refetch data when page changes
    useEffect(() => {
        refetch()
    }, [queryArgs.page, refetch])

    const handleItemClick = (item: typeof dropdownItems[0]) => {
        setSelectedItem(item)
        setIsDialogOpen(true)
    }

    const onSelectionChange = (clientId: string) => {
        setSelectedClientId(clientId)
    }

    const onButtonClick = () => {
        if (!selectedItem) return
        router.push(`${selectedItem?.href}/${selectedClientId}`)
    }

    const handleFilterChange = (
        filterType: 'client' | 'product' | 'status' | 'purchaseType' | 'parentCompany' | 'clientId' | 'parentCompanyId',
        value: string | undefined
    ) => {
        setQueryArgs(prev => ({ ...prev, [filterType]: value, page: 1 })) // Reset page on filter change
    }

    const handleAmcPendingChange = (value: boolean) => {
        setQueryArgs(prev => ({ ...prev, amcPending: value, page: 1 }))
    }

    const handleFYFilterChange = (fy: string | undefined) => {
        setQueryArgs(prev => ({ ...prev, fy, page: 1 }))
    }

    const handleCustomDateChange = (startDate: string, endDate: string) => {
        setQueryArgs(prev => ({
            ...prev,
            startDate,
            endDate,
            page: 1
        }))
    }

    const dateRangeSelector = React.useMemo(() => ({
        startDate: queryArgs.startDate ? new Date(queryArgs.startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        endDate: queryArgs.endDate ? new Date(queryArgs.endDate) : new Date()
    }), [queryArgs.startDate, queryArgs.endDate]);

    const handlePageChange = (page: number) => {
        setQueryArgs(prev => ({ ...prev, page }))
    }

    return (
        <div>
            <div className="flex items-center justify-between">
                <Typography variant='h1' className='text-2xl md:text-3xl'>Purchases List</Typography>
                <DropdownMenu>
                    <DropdownMenuTrigger className='flex gap-2 bg-black text-white rounded py-2 px-3 text-sm items-center cursor-pointer hover:bg-gray-800 transition-colors duration-200'>
                        <Plus className='md:w-6 w-4' />
                        <span className='text-xs md:text-base'>Add New Purchase</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-[200px]'>
                        {dropdownItems.map((item, index) => (
                            <DropdownMenuItem
                                key={index}
                                className='cursor-pointer'
                                onClick={() => handleItemClick(item)}>
                                {item.label}
                            </DropdownMenuItem>

                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Client</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {/* Add form fields here based on the selected item */}
                        <Select onValueChange={onSelectionChange}>
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="Select Client" />
                            </SelectTrigger>
                            <SelectContent className="w-full">
                                {clientsList?.data.map((client) => (
                                    <SelectItem key={client._id} value={client._id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button onClick={onButtonClick}>Continue</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <br />

            <PurchasesList
                data={data?.data.purchases ?? []}
                pagination={data?.data.pagination ?? { total: 0, page: 1, limit: 10 }}
                initialFilters={queryArgs}
                onFilterChange={handleFilterChange}
                onAmcPendingChange={handleAmcPendingChange}
                onPageChange={handlePageChange}
                isLoading={isFetching}
                selectedFY={queryArgs.fy}
                onFYFilterChange={handleFYFilterChange}
                onCustomDateChange={handleCustomDateChange}
                dateRange={dateRangeSelector}
            />
        </div>
    )
}

export default Purchase