'use client'
import { useGetAllPendingPaymentsQuery } from '@/redux/api/order'
import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import PendingPaymentsDataTable from './PendingPaymentsDataTable'
import Typography from '../ui/Typography'

const PendingPayment = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const page = searchParams.get('page') || 1
    const {
        data,
        isLoading,
        refetch
    } = useGetAllPendingPaymentsQuery({ page: Number(page), limit: 10 })

    const handlePagination = (page: number) => {
        router.push(`/pending-payments?page=${page}`)
        refetch()
    }

    return (
        <>
            <Typography variant="h1">Pending Payments</Typography>
            <div className='mt-5'>
                {isLoading ? (
                    <div>Loading...</div>
                ) : (
                    <PendingPaymentsDataTable page={Number(page) } handlePagination={handlePagination} data={data?.data?.pending_payments ?? []} pagination={data?.data.pagination ?? { total: 0, currentPage: 1, totalPages: 1, limit: 10, hasPreviousPage: false, hasNextPage: false }} />
                )}
            </div>
        </>
    )
}

export default PendingPayment