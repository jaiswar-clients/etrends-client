'use client'
import { useGetAllPendingPaymentsQuery, useGetOrderFiltersOfCompanyQuery } from '@/redux/api/order'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import PendingPaymentsDataTable from './PendingPaymentsDataTable'
import Typography from '../ui/Typography'

const PendingPayment = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
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
    
    const [queryArgs, setQueryArgs] = useState(() => {
        const pageParam = searchParams.get('page')
        const fyParam = searchParams.get('fy')
        const startDateParam = searchParams.get('startDate')
        const endDateParam = searchParams.get('endDate')
        const clientIdParam = searchParams.get('clientId')
        const typeParam = searchParams.get('type') as 'order' | 'amc' | 'all' | null
        
        return {
            page: pageParam ? parseInt(pageParam) : 1,
            fy: fyParam || undefined,
            startDate: startDateParam || undefined,
            endDate: endDateParam || undefined,
            clientId: clientIdParam || undefined,
            type: typeParam || 'all'
        }
    })

    const { data: filtersData } = useGetOrderFiltersOfCompanyQuery()

    const {
        data,
        isLoading,
        refetch
    } = useGetAllPendingPaymentsQuery({ 
        page: queryArgs.page, 
        limit: 20,
        startDate: queryArgs.startDate,
        endDate: queryArgs.endDate,
        clientId: queryArgs.clientId,
        type: queryArgs.type
    })

    useEffect(() => {
        const params: Record<string, string | number | undefined> = {
            page: queryArgs.page,
            fy: queryArgs.fy,
            startDate: queryArgs.startDate,
            endDate: queryArgs.endDate,
            clientId: queryArgs.clientId,
            type: queryArgs.type
        };
        const queryString = createQueryString(params);
        router.replace(`${pathname}?${queryString}`, { scroll: false });
    }, [queryArgs, router, pathname]);

    useEffect(() => {
        refetch();
    }, [queryArgs.page, queryArgs.fy, queryArgs.startDate, queryArgs.endDate, queryArgs.clientId, queryArgs.type, refetch]);

    const handlePagination = (page: number) => {
        setQueryArgs(prev => ({ ...prev, page }))
    }
    
    const handleFYFilterChange = (fy: string | undefined) => {
        setQueryArgs(prev => ({ ...prev, fy, startDate: undefined, endDate: undefined, page: 1 }))
    }
    
    const handleCustomDateChange = (startDate: string, endDate: string) => {
        setQueryArgs(prev => ({
            ...prev,
            startDate,
            endDate,
            fy: undefined,
            page: 1
        }))
    }

    const handleClientFilterChange = (clientId: string | undefined) => {
        setQueryArgs(prev => ({ ...prev, clientId, page: 1 }))
    }
    
    const handleTypeFilterChange = (type: 'order' | 'amc' | 'all') => {
        setQueryArgs(prev => ({ ...prev, type, page: 1 }))
    }
    
    const dateRangeSelector = React.useMemo(() => ({
        startDate: queryArgs.startDate ? new Date(queryArgs.startDate) : undefined,
        endDate: queryArgs.endDate ? new Date(queryArgs.endDate) : undefined
    }), [queryArgs.startDate, queryArgs.endDate]);

    return (
        <>
            <Typography variant="h1">Pending Payments</Typography>
            <div className='mt-5'>
                {isLoading ? (
                    <div>Loading...</div>
                ) : (
                    <PendingPaymentsDataTable 
                        handlePagination={handlePagination} 
                        data={data?.data?.pending_payments ?? []} 
                        pagination={data?.data.pagination ?? { total: 0, currentPage: 1, totalPages: 1, limit: 10, hasPreviousPage: false, hasNextPage: false }} 
                        selectedFY={queryArgs.fy}
                        onFYFilterChange={handleFYFilterChange}
                        onCustomDateChange={handleCustomDateChange}
                        dateRange={dateRangeSelector}
                        clients={filtersData?.data?.clients ?? []}
                        selectedClientId={queryArgs.clientId}
                        onClientFilterChange={handleClientFilterChange}
                        selectedType={queryArgs.type}
                        onTypeFilterChange={handleTypeFilterChange}
                    />
                )}
            </div>
        </>
    )
}

export default PendingPayment