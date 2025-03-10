"use client"
import React, { useState } from 'react'
import AMCList from './AMCList'
import { useGetAllAMCQuery } from '@/redux/api/order'

export enum AMC_FILTER {
    UPCOMING = 'upcoming',
    ALL = 'all',
    PAID = 'paid',
    PENDING = 'pending',
    OVERDUE = 'overdue'
}

const AMC = () => {
    const [queryArgs, setQueryArgs] = useState<{ page?: number, limit?: number, filter: AMC_FILTER, options: { upcoming: number } }>({ filter: AMC_FILTER.UPCOMING, options: { upcoming: 1 }, page: 1, limit: 10 })
    const { data, refetch } = useGetAllAMCQuery(queryArgs)

    const handleFilterChange = (filter: AMC_FILTER, options?: { upcoming: number }) => {
        setQueryArgs({ ...queryArgs, filter, ...(options && { options }) })
        refetch()
    }

    const handlePagination = (page: number) => {
        setQueryArgs({ ...queryArgs, page })
        refetch()
    }

    return <AMCList
        data={data?.data?.data ?? []}
        pagination={data?.data?.pagination ?? { total: 0, limit: 0, page: 0, pages: 0 }}
        changeFilter={handleFilterChange}
        onPageChange={handlePagination}
        currentPage={queryArgs.page ?? 1}
    />
}


export default AMC