"use client"
import React, { useState, useEffect } from 'react'
import AMCList from './AMCList'
import { useGetAllAMCQuery } from '@/redux/api/order'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export enum AMC_FILTER {
    UPCOMING = 'upcoming',
    ALL = 'all',
    PAID = 'paid',
    PENDING = 'pending',
    OVERDUE = 'overdue',
    PROFORMA = 'proforma',
    INVOICE = 'invoice',
}

const AMC = () => {
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
        const initialFilter = searchParams?.get('filter') as AMC_FILTER || AMC_FILTER.UPCOMING
        const initialUpcoming = searchParams?.get('upcoming')
        const initialStartDate = searchParams?.get('startDate')
        const initialEndDate = searchParams?.get('endDate')
        const initialPage = searchParams?.get('page')
        const initialClient = searchParams?.get('client')
        const initialProduct = searchParams?.get('product')

        const options: any = {}
        if (initialUpcoming !== null) options.upcoming = Number(initialUpcoming)
        if (initialStartDate) options.startDate = initialStartDate
        if (initialEndDate) options.endDate = initialEndDate

        return {
            page: initialPage ? Number(initialPage) : 1,
            limit: 10,
            filter: initialFilter,
            options,
            client: initialClient ?? undefined,
            product: initialProduct ?? undefined,
        }
    })

    const { data, refetch, isFetching } = useGetAllAMCQuery(queryArgs)

    useEffect(() => {
        const queryString = createQueryString({
            filter: queryArgs.filter,
            upcoming: queryArgs.options?.upcoming,
            startDate: queryArgs.options?.startDate,
            endDate: queryArgs.options?.endDate,
            page: queryArgs.page,
            client: queryArgs.client,
            product: queryArgs.product,
        })
        router.replace(`${pathname}?${queryString}`, { scroll: false })
    }, [queryArgs, router, pathname, searchParams])

    useEffect(() => {
        refetch()
    }, [queryArgs, refetch])

    const handleFilterChange = (filter: AMC_FILTER, options?: { upcoming?: number, startDate?: string, endDate?: string }) => {
        setQueryArgs(prevArgs => ({ ...prevArgs, filter, options: options ?? {}, page: 1 }))
    }

    const handlePagination = (page: number) => {
        setQueryArgs(prevArgs => ({ ...prevArgs, page }))
    }

    const handleClientFilterChange = (client: string | undefined) => {
        setQueryArgs(prevArgs => ({ ...prevArgs, client: client || undefined, page: 1 }))
    }

    const handleProductFilterChange = (product: string | undefined) => {
        setQueryArgs(prevArgs => ({ ...prevArgs, product: product || undefined, page: 1 }))
    }

    const activeFilter = queryArgs.filter
    const showUpcomingMonthsFilter = activeFilter === AMC_FILTER.UPCOMING && !queryArgs.options?.startDate
    const dateRangeSelector = {
        show: !!queryArgs.options?.startDate,
        startDate: queryArgs.options?.startDate ? new Date(queryArgs.options.startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        endDate: queryArgs.options?.endDate ? new Date(queryArgs.options.endDate) : new Date()
    }
    const upcomingMonthValue = queryArgs.options?.upcoming?.toString() ?? (queryArgs.options?.startDate ? 'custom' : '1')

    return <AMCList
        data={data?.data?.data ?? []}
        pagination={data?.data?.pagination ?? { total: 0, limit: 10, page: 1, pages: 0 }}
        changeFilter={handleFilterChange}
        onPageChange={handlePagination}
        currentPage={queryArgs.page ?? 1}
        initialClientFilter={queryArgs.client}
        initialProductFilter={queryArgs.product}
        onClientFilterChange={handleClientFilterChange}
        onProductFilterChange={handleProductFilterChange}
        activeFilter={activeFilter}
        showUpcomingMonthsFilter={showUpcomingMonthsFilter}
        dateRangeSelector={dateRangeSelector}
        upcomingMonthValue={upcomingMonthValue}
        isLoading={isFetching}
    />
}


export default AMC