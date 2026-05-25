"use client"
import React, { useState, useEffect } from 'react'
import PendingPaymentsList from './PendingPaymentsList'
import { useGetPendingPaymentsQuery, useGetOrderFiltersOfCompanyQuery } from '@/redux/api/order'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { generateFinancialYears } from '@/components/common/FinancialYearFilter'

const getDefaultFY = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const startYear = m >= 3 ? y : y - 1
    return `FY${startYear}-${startYear + 1}`
}

const PendingPayments = () => {
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
        const initialStartDate = searchParams?.get('startDate')
        const initialEndDate = searchParams?.get('endDate')
        const initialClient = searchParams?.get('client')
        const initialClientId = searchParams?.get('clientId')
        const initialProduct = searchParams?.get('product')
        const initialProductIds = searchParams?.get('productIds')
        const initialTypes = searchParams?.get('types')
        const initialFY = searchParams?.get('fy')
        const urlPage = searchParams?.get('page')
        const urlPageSize = searchParams?.get('pageSize')

        let startDate = initialStartDate || undefined
        let endDate = initialEndDate || undefined
        let fy = initialFY || undefined

        if (!initialFY && initialStartDate && initialEndDate) {
            const financialYears = generateFinancialYears()
            const matchingFY = financialYears.find(fy => {
                const normalizeDate = (dateStr: string) => {
                    const d = new Date(dateStr)
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
                }
                const fyStart = normalizeDate(fy.startDate)
                const fyEnd = normalizeDate(fy.endDate)
                const inputStart = normalizeDate(initialStartDate)
                const inputEnd = normalizeDate(initialEndDate)
                return fyStart.getTime() === inputStart.getTime() && fyEnd.getTime() === inputEnd.getTime()
            })
            if (matchingFY) fy = matchingFY.id
        }

        if (!initialStartDate && !initialEndDate && !fy) {
            fy = getDefaultFY()
            const financialYears = generateFinancialYears()
            const defaultFYObj = financialYears.find(f => f.id === fy)
            if (defaultFYObj) {
                const startYear = parseInt(defaultFYObj.id.substring(2, 6))
                startDate = defaultFYObj.startDate
                endDate = new Date(startYear + 1, 2, 31, 23, 59, 59, 999).toISOString()
            }
        }

        return {
            page: urlPage ? parseInt(urlPage) : 1,
            pageSize: urlPageSize ? parseInt(urlPageSize) : 10,
            startDate,
            endDate,
            client: initialClient || undefined,
            clientId: initialClientId || undefined,
            products: initialProduct ? initialProduct.split(',') : [],
            productIds: initialProductIds ? initialProductIds.split(',') : [],
            types: initialTypes ? initialTypes.split(',') : [],
            fy,
        }
    })

    const { data, refetch, isFetching } = useGetPendingPaymentsQuery({
        page: queryArgs.page,
        limit: queryArgs.pageSize,
        startDate: queryArgs.startDate,
        endDate: queryArgs.endDate,
        client_id: queryArgs.clientId,
        product_id: queryArgs.productIds.length > 0 ? queryArgs.productIds.join(',') : undefined,
        type: queryArgs.types.length > 0 ? queryArgs.types.join(',') : undefined,
    })

    const { data: filtersData } = useGetOrderFiltersOfCompanyQuery()

    useEffect(() => {
        const params: Record<string, string | number | undefined> = {
            startDate: queryArgs.startDate,
            endDate: queryArgs.endDate,
            client: queryArgs.client,
            clientId: queryArgs.clientId,
            product: queryArgs.products.length > 0 ? queryArgs.products.join(',') : undefined,
            productIds: queryArgs.productIds.length > 0 ? queryArgs.productIds.join(',') : undefined,
            types: queryArgs.types.length > 0 ? queryArgs.types.join(',') : undefined,
            fy: queryArgs.fy,
            page: queryArgs.page,
            pageSize: queryArgs.pageSize,
        }
        const queryString = createQueryString(params)
        router.replace(`${pathname}?${queryString}`, { scroll: false })
    }, [queryArgs, router, pathname])

    useEffect(() => {
        refetch()
    }, [queryArgs.page, queryArgs.pageSize, queryArgs.startDate, queryArgs.endDate, queryArgs.clientId, queryArgs.types, queryArgs.productIds, refetch])

    const handleFYFilterChange = (fy: string | undefined) => {
        setQueryArgs(prev => {
            if (!fy) {
                return { ...prev, fy: undefined, startDate: undefined, endDate: undefined, page: 1 }
            }
            const financialYears = generateFinancialYears()
            const fyObj = financialYears.find(f => f.id === fy)
            if (fyObj) {
                const startYear = parseInt(fyObj.id.substring(2, 6))
                // Use local-time March 31 end-of-day, then convert to ISO for the API
                const endDate = new Date(startYear + 1, 2, 31, 23, 59, 59, 999)
                return {
                    ...prev,
                    fy,
                    startDate: fyObj.startDate,
                    endDate: endDate.toISOString(),
                    page: 1,
                }
            }
            return { ...prev, fy, page: 1 }
        })
    }

    const handleCustomDateChange = (startDate: string, endDate: string) => {
        setQueryArgs(prev => {
            const financialYears = generateFinancialYears()
            const matchingFY = financialYears.find(fy => {
                const normalizeDate = (dateStr: string) => {
                    const d = new Date(dateStr)
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
                }
                const fyStart = normalizeDate(fy.startDate)
                const fyEnd = normalizeDate(fy.endDate)
                const inputStart = normalizeDate(startDate)
                const inputEnd = normalizeDate(endDate)
                return fyStart.getTime() === inputStart.getTime() && fyEnd.getTime() === inputEnd.getTime()
            })
            return { ...prev, fy: matchingFY?.id, startDate, endDate, page: 1 }
        })
    }

    const handleClientFilterChange = (clientName: string | undefined, clientId: string | undefined) => {
        setQueryArgs(prev => ({ ...prev, client: clientName, clientId, page: 1 }))
    }

    const handleProductFilterChange = (productNames: string[], productIds: string[]) => {
        setQueryArgs(prev => ({ ...prev, products: productNames, productIds, page: 1 }))
    }

    const handleTypesChange = (types: string[]) => {
        setQueryArgs(prev => ({ ...prev, types, page: 1 }))
    }

    const handlePageChange = (page: number) => {
        setQueryArgs(prev => ({ ...prev, page }))
    }

    const dateRangeSelector = React.useMemo(() => ({
        startDate: queryArgs.startDate ? new Date(queryArgs.startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        endDate: queryArgs.endDate ? new Date(queryArgs.endDate) : new Date()
    }), [queryArgs.startDate, queryArgs.endDate])

    return <PendingPaymentsList
        data={data?.data?.data ?? []}
        pagination={data?.data?.pagination ?? { total: 0, limit: 10, page: 1, pages: 0, hasNextPage: false, hasPreviousPage: false }}
        totalAmount={{
            total: data?.data?.total_amount?.total ?? 0,
            new_order: data?.data?.total_amount?.new_order ?? 0,
            customization: data?.data?.total_amount?.customization ?? 0,
            auditor_licence: data?.data?.total_amount?.auditor_licence ?? 0,
            amc: data?.data?.total_amount?.amc ?? 0,
        }}
        initialFilters={{
            client: queryArgs.client,
            clientId: queryArgs.clientId,
            products: queryArgs.products,
            productIds: queryArgs.productIds,
            types: queryArgs.types,
            page: queryArgs.page,
            pageSize: queryArgs.pageSize,
            fy: queryArgs.fy,
            startDate: queryArgs.startDate,
            endDate: queryArgs.endDate,
        }}
        onClientFilterChange={handleClientFilterChange}
        onProductFilterChange={handleProductFilterChange}
        onTypesChange={handleTypesChange}
        onPageChange={handlePageChange}
        isLoading={isFetching}
        selectedFY={queryArgs.fy}
        onFYFilterChange={handleFYFilterChange}
        onCustomDateChange={handleCustomDateChange}
        dateRange={dateRangeSelector}
        companyData={filtersData?.data}
    />
}

export default PendingPayments
