"use client"
import React, { useState, useEffect } from 'react'
import Typography from '../ui/Typography'
import ClientList from './ClientList'
import { Button } from '../ui/button'
import { Plus, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { useGetClientsQuery, useGetClientStatsQuery } from '@/redux/api/client'
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
    const createQueryString = React.useCallback(
        (params: Record<string, string | number | string[] | undefined>) => {
            const newSearchParams = new URLSearchParams(searchParams?.toString())
            for (const [key, value] of Object.entries(params)) {
                if (
                    value === undefined ||
                    value === null ||
                    (typeof value === 'string' && value === '') ||
                    (Array.isArray(value) && value.length === 0)
                ) {
                    newSearchParams.delete(key)
                } else if (Array.isArray(value)) {
                    newSearchParams.set(key, value.join(','))
                } else {
                    newSearchParams.set(key, String(value))
                }
            }
            return newSearchParams.toString()
        },
        [searchParams]
    )

    // Get initial filters from URL
    const [queryArgs, setQueryArgs] = useState(() => {
        const initialClientFilter = searchParams?.get('client')
        const initialClientIdFilter = searchParams?.get('clientId')
        const initialProductFilter = searchParams?.get('products')
        const initialProductIdFilter = searchParams?.get('productIds')
        const initialIndustryFilter = searchParams?.get('industries')
        const initialParentCompanyFilter = searchParams?.get('parentCompany')
        const initialParentCompanyIdFilter = searchParams?.get('parentCompanyId')
        const initialHasOrdersFilter = searchParams?.get('hasOrders') === 'true'
        const initialFY = searchParams?.get('fy')
        const initialStartDate = searchParams?.get('startDate')
        const initialEndDate = searchParams?.get('endDate')
        const urlPage = searchParams?.get('page')
        const urlPageSize = searchParams?.get('pageSize')
        const initialStatuses = searchParams?.get('statuses')

        return {
            client: initialClientFilter || undefined,
            clientId: initialClientIdFilter || undefined,
            products: initialProductFilter ? initialProductFilter.split(',') : undefined,
            productIds: initialProductIdFilter ? initialProductIdFilter.split(',') : undefined,
            industries: initialIndustryFilter ? initialIndustryFilter.split(',') : undefined,
            parentCompany: initialParentCompanyFilter || undefined,
            parentCompanyId: initialParentCompanyIdFilter || undefined,
            hasOrders: initialHasOrdersFilter,
            fy: initialFY || undefined,
            startDate: initialStartDate || undefined,
            endDate: initialEndDate || undefined,
            page: urlPage ? parseInt(urlPage) : 1,
            pageSize: urlPageSize ? parseInt(urlPageSize) : 10,
            statuses: initialStatuses
                ? initialStatuses.split(',') as ('active' | 'inactive')[]
                : ['active'] as ('active' | 'inactive')[]
        }
    })

    // Prepare filters for API query
    const { data, isSuccess, refetch, isFetching } = useGetClientsQuery({
        limit: queryArgs.pageSize,
        page: queryArgs.page,
        all: false,
        parent_company_id: queryArgs.parentCompanyId,
        client_name: queryArgs.client,
        industry: queryArgs.industries?.join(','),
        product_id: queryArgs.productIds?.join(','),
        startDate: queryArgs.fy ? undefined : queryArgs.startDate,
        endDate: queryArgs.fy ? undefined : queryArgs.endDate,
        has_orders: queryArgs.hasOrders ? 'true' : undefined,
        status: queryArgs.statuses?.join(','),
        financial_year: queryArgs.fy ? queryArgs.fy.replace('FY', '').split('-')[0] : undefined,
    })

    // Fetch stats (without status filter)
    const { data: statsData } = useGetClientStatsQuery({
        parent_company_id: queryArgs.parentCompanyId,
        client_name: queryArgs.client,
        industry: queryArgs.industries?.join(','),
        product_id: queryArgs.productIds?.join(','),
        startDate: queryArgs.fy ? undefined : queryArgs.startDate,
        endDate: queryArgs.fy ? undefined : queryArgs.endDate,
        has_orders: queryArgs.hasOrders ? 'true' : undefined,
        financial_year: queryArgs.fy ? queryArgs.fy.replace('FY', '').split('-')[0] : undefined,
    })

    // Effect to update URL when filters change
    useEffect(() => {
        const queryString = createQueryString({
            client: queryArgs.client,
            clientId: queryArgs.clientId,
            products: queryArgs.products,
            productIds: queryArgs.productIds,
            industries: queryArgs.industries,
            parentCompany: queryArgs.parentCompany,
            parentCompanyId: queryArgs.parentCompanyId,
            hasOrders: queryArgs.hasOrders ? 'true' : undefined,
            fy: queryArgs.fy,
            startDate: queryArgs.startDate,
            endDate: queryArgs.endDate,
            page: queryArgs.page,
            pageSize: queryArgs.pageSize,
            statuses: queryArgs.statuses
        })

        // Use replace to avoid adding duplicate entries to history
        router.replace(`${pathname}?${queryString}`, { scroll: false })
    }, [queryArgs, router, pathname, createQueryString])

    // Effect to refetch data when page changes
    useEffect(() => {
        refetch()
    }, [queryArgs.page, refetch])

    const handleFilterChange = (
        filterType: 'client' | 'product' | 'industry' | 'parentCompany' | 'clientId' | 'productId' | 'parentCompanyId',
        value: string | string[] | undefined
    ) => {
        setQueryArgs(prev => ({ ...prev, [filterType]: value, page: 1 })) // Reset page on filter change
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

    const handlePageSizeChange = (pageSize: number) => {
        setQueryArgs(prev => ({ ...prev, pageSize, page: 1 }))
    }

    const handleStatusChange = (statuses: ('active' | 'inactive')[]) => {
        setQueryArgs(prev => ({ ...prev, statuses, page: 1 }))
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
            if (queryArgs.industries?.length) {
                params.append("industry", queryArgs.industries.join(','))
            }
            if (queryArgs.productIds?.length) {
                params.append("product_id", queryArgs.productIds.join(','))
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
            if (queryArgs.statuses?.length) {
                params.append("status", queryArgs.statuses.join(','))
            }
            if (queryArgs.fy) {
                params.append("financial_year", queryArgs.fy.replace('FY', '').split('-')[0])
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
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onStatusChange={handleStatusChange}
                        isLoading={isFetching}
                        selectedFY={queryArgs.fy}
                        onFYFilterChange={handleFYFilterChange}
                        onCustomDateChange={handleCustomDateChange}
                        dateRange={dateRangeSelector}
                        stats={statsData?.data}
                    />
                )
            }
        </div>
    )
}

export default Client