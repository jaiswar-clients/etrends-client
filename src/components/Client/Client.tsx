"use client"
import React, { useState, useEffect } from 'react'
import Typography from '../ui/Typography'
import ClientList from './ClientList'
import { Button } from '../ui/button'
import { Plus, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { useGetClientsQuery } from '@/redux/api/client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { RootState } from '@/redux/store'
import { useAppSelector } from '@/redux/hook'

const Client = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const authToken = useAppSelector((state: RootState) => state.user.user.token)
    const [isDownloading, setIsDownloading] = useState(false)
    
    // Function to update query params
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
    
    // Get initial filters from URL
    const [queryArgs, setQueryArgs] = useState(() => {
        const initialClientFilter = searchParams?.get('client')
        const initialClientIdFilter = searchParams?.get('clientId')
        const initialProductFilter = searchParams?.get('product')
        const initialProductIdFilter = searchParams?.get('productId')
        const initialIndustryFilter = searchParams?.get('industry')
        const initialParentCompanyFilter = searchParams?.get('parentCompany')
        const initialParentCompanyIdFilter = searchParams?.get('parentCompanyId')
        const initialHasOrdersFilter = searchParams?.get('hasOrders') === 'true'
        const initialFY = searchParams?.get('fy')
        const initialStartDate = searchParams?.get('startDate')
        const initialEndDate = searchParams?.get('endDate')
        const urlPage = searchParams?.get('page')
        
        return {
            client: initialClientFilter || undefined,
            clientId: initialClientIdFilter || undefined,
            product: initialProductFilter || undefined,
            productId: initialProductIdFilter || undefined,
            industry: initialIndustryFilter || undefined,
            parentCompany: initialParentCompanyFilter || undefined,
            parentCompanyId: initialParentCompanyIdFilter || undefined,
            hasOrders: initialHasOrdersFilter,
            fy: initialFY || undefined,
            startDate: initialStartDate || undefined,
            endDate: initialEndDate || undefined,
            page: urlPage ? parseInt(urlPage) : 1
        }
    })
    
    // Prepare filters for API query
    const { data, isSuccess, refetch, isFetching } = useGetClientsQuery({ 
        limit: 10, 
        page: queryArgs.page, 
        all: false, // Changed to false to enable pagination
        parent_company_id: queryArgs.parentCompanyId,
        client_name: queryArgs.client,
        industry: queryArgs.industry,
        product_id: queryArgs.productId,
        startDate: queryArgs.startDate,
        endDate: queryArgs.endDate,
        has_orders: queryArgs.hasOrders ? 'true' : undefined
    })
    
    // Effect to update URL when filters change
    useEffect(() => {
        const queryString = createQueryString({
            client: queryArgs.client,
            clientId: queryArgs.clientId,
            product: queryArgs.product,
            productId: queryArgs.productId,
            industry: queryArgs.industry,
            parentCompany: queryArgs.parentCompany,
            parentCompanyId: queryArgs.parentCompanyId,
            hasOrders: queryArgs.hasOrders ? 'true' : undefined,
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
    
    const handleFilterChange = (
        filterType: 'client' | 'product' | 'industry' | 'parentCompany' | 'clientId' | 'productId' | 'parentCompanyId',
        value: string | undefined
    ) => {
        setQueryArgs(prev => ({ ...prev, [filterType]: value, page: 1 })) // Reset page on filter change
    }
    
    const handleHasOrdersChange = (value: boolean) => {
        setQueryArgs(prev => ({ ...prev, hasOrders: value, page: 1 }))
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
    
    // Handle Excel export
    const handleExportClick = async () => {
        setIsDownloading(true)
        try {
            // Show a toast to indicate that the export is in progress
            toast({
                title: "Preparing export",
                description: "Generating Excel file with your client data...",
                variant: "default",
                duration: 3000,
            })

            // Construct query parameters
            const params = new URLSearchParams({
                all: "true",
            })
            
            if (queryArgs.parentCompanyId) {
                params.append("parent_company_id", queryArgs.parentCompanyId)
            }
            if (queryArgs.client) {
                params.append("client_name", queryArgs.client)
            }
            if (queryArgs.industry) {
                params.append("industry", queryArgs.industry)
            }
            if (queryArgs.productId) {
                params.append("product_id", queryArgs.productId)
            }
            if (queryArgs.startDate) {
                params.append("startDate", queryArgs.startDate)
            }
            if (queryArgs.endDate) {
                params.append("endDate", queryArgs.endDate)
            }
            if (queryArgs.hasOrders) {
                params.append("has_orders", "true")
            }

            const exportUrl = `${process.env.NEXT_PUBLIC_API_URL}/clients/export?${params.toString()}`

            // Perform direct fetch
            const response = await fetch(exportUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const blob = await response.blob()

            // Handle the download
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            const currentDate = new Date().toISOString().split("T")[0]
            link.href = url
            link.setAttribute("download", `Client_Export_${currentDate}.xlsx`)
            document.body.appendChild(link)
            link.click()

            // Clean up
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast({
                title: "Export successful",
                description: "Your client data has been exported to Excel.",
                variant: "default",
            })
        } catch (error) {
            console.error("Export error:", error)
            toast({
                title: "Export failed",
                description: "There was an error exporting the data. Please try again or check the console for details.",
                variant: "destructive",
            })
        } finally {
            setIsDownloading(false)
        }
    }
    
    return (
        <div>
            <div className="flex items-center justify-between">
                <Typography variant='h1' className='text-2xl md:text-3xl'>Client List</Typography>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExportClick}
                        className="bg-green-600 hover:bg-green-700 shadow-sm transition-all"
                        disabled={isDownloading}
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        {isDownloading ? "Preparing Excel..." : "Export to Excel"}
                    </Button>
                    <Link passHref href={"/clients/add"}>
                        <Button>
                            <Plus />
                            Add Client
                        </Button>
                    </Link>
                </div>
            </div>

            <br />

            {
                isSuccess && (
                    <ClientList 
                        data={data?.data.clients ?? []}
                        pagination={data?.data.pagination ?? { total: 0, page: 1, limit: 10, pages: 1 }}
                        initialFilters={queryArgs}
                        onFilterChange={handleFilterChange}
                        onHasOrdersChange={handleHasOrdersChange}
                        onPageChange={handlePageChange}
                        isLoading={isFetching}
                        selectedFY={queryArgs.fy}
                        onFYFilterChange={handleFYFilterChange}
                        onCustomDateChange={handleCustomDateChange}
                        dateRange={dateRangeSelector}
                    />
                )
            }
        </div>
    )
}

export default Client