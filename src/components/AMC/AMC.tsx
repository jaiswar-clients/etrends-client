"use client"
import React, { useState, useEffect } from 'react'
import AMCList from './AMCList'
import { useGetAllAMCQuery, useGetOrderFiltersOfCompanyQuery } from '@/redux/api/order'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { generateFinancialYears } from '@/components/common/FinancialYearFilter'

export enum AMC_FILTER {
    PAID = 'paid',
    PENDING = 'pending',
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
        const initialFilterStr = searchParams?.get('filter') || AMC_FILTER.PENDING
        const initialFilters = initialFilterStr.split(',') as AMC_FILTER[];
        const initialStartDate = searchParams?.get('startDate')
        const initialEndDate = searchParams?.get('endDate')
        const initialPage = searchParams?.get('page')
        const initialClientId = searchParams?.get('client_id')
        const initialProductId = searchParams?.get('product_id')
        const initialFY = searchParams?.get('fy')

        const options: { startDate?: string; endDate?: string } = {
            
        }
        if (initialStartDate) options.startDate = initialStartDate
        if (initialEndDate) options.endDate = initialEndDate

        // If FY is not in URL but dates are present, check if dates match a financial year
        let detectedFY = initialFY;
        if (!initialFY && initialStartDate && initialEndDate) {
            const financialYears = generateFinancialYears();
            const matchingFY = financialYears.find(fy => {
                const normalizeDate = (dateStr: string) => {
                    const d = new Date(dateStr);
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                };
                
                const fyStart = normalizeDate(fy.startDate);
                const fyEnd = normalizeDate(fy.endDate);
                const inputStart = normalizeDate(initialStartDate);
                const inputEnd = normalizeDate(initialEndDate);
                
                return fyStart.getTime() === inputStart.getTime() && 
                       fyEnd.getTime() === inputEnd.getTime();
            });
            if (matchingFY) {
                detectedFY = matchingFY.id;
            }
        }

        return {
            page: initialPage ? Number(initialPage) : 1,
            limit: 10,
            filters: initialFilters,
            options,
            client_id: initialClientId ?? undefined,
            product_id: initialProductId ?? undefined,
            fy: detectedFY ?? undefined
        }
    })

    const { data, refetch, isFetching } = useGetAllAMCQuery({
        page: queryArgs.page,
        limit: queryArgs.limit,
        filter: queryArgs.filters.join(',') as AMC_FILTER,
        options: queryArgs.options,
        client_id: queryArgs.client_id,
        product_id: queryArgs.product_id
    })

    const { data: filtersData } = useGetOrderFiltersOfCompanyQuery()

    useEffect(() => {
        // Create a new object without the boolean property
        const params: Record<string, string | number | undefined> = {
            filter: queryArgs.filters.join(','),
            startDate: queryArgs.options?.startDate,
            endDate: queryArgs.options?.endDate,
            page: queryArgs.page,
            client_id: queryArgs.client_id,
            product_id: queryArgs.product_id,
            fy: queryArgs.fy
        }

        const queryString = createQueryString(params)
        router.replace(`${pathname}?${queryString}`, { scroll: false })
    }, [queryArgs, router, pathname, searchParams])

    useEffect(() => {
        refetch()
    }, [queryArgs, refetch])

    const handleFilterChange = (filters: string[], options?: { startDate?: string, endDate?: string }) => {
        setQueryArgs(prevArgs => ({
            ...prevArgs,
            filters: filters as AMC_FILTER[],
            options: {
                // upcoming: prevArgs.options.upcoming,
                ...(options ?? {})
            },
            page: 1
        }))
    }

    const handlePagination = (page: number) => {
        setQueryArgs(prevArgs => ({ ...prevArgs, page }))
    }

    const handleClientFilterChange = (client: string | undefined) => {
        setQueryArgs(prevArgs => ({ ...prevArgs, client_id: client || undefined, page: 1 }))
    }

    const handleProductFilterChange = (product: string | undefined) => {
        setQueryArgs(prevArgs => ({ ...prevArgs, product_id: product || undefined, page: 1 }))
    }

    const handleFYFilterChange = (fy: string | undefined) => {
        setQueryArgs(prevArgs => {
            if (!fy) {
                // When clearing FY filter, also clear the date options to reset to default
                return {
                    ...prevArgs,
                    fy: undefined,
                    options: {}, // Clear the date options
                    page: 1
                }
            } else {
                return {
                    ...prevArgs,
                    fy,
                    page: 1
                }
            }
        })
    }

    const handleCustomDateChange = (startDate: string, endDate: string) => {
        setQueryArgs(prevArgs => {
            // Check if the dates match a financial year
            const financialYears = generateFinancialYears();
            const matchingFY = financialYears.find(fy => {
                // Compare dates by normalizing to date-only (ignoring time)
                const normalizeDate = (dateStr: string) => {
                    const d = new Date(dateStr);
                    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                };
                
                const fyStart = normalizeDate(fy.startDate);
                const fyEnd = normalizeDate(fy.endDate);
                const inputStart = normalizeDate(startDate);
                const inputEnd = normalizeDate(endDate);
                
                // Compare date values (time set to 00:00:00)
                return fyStart.getTime() === inputStart.getTime() && 
                       fyEnd.getTime() === inputEnd.getTime();
            });

            return {
                ...prevArgs,
                // Set FY if dates match a financial year, otherwise clear it
                fy: matchingFY ? matchingFY.id : undefined,
                options: {
                    startDate,
                    endDate
                },
                page: 1
            }
        })
    }

    const dateRangeSelector = React.useMemo(() => ({
        show: true,
        startDate: queryArgs.options?.startDate ? new Date(queryArgs.options.startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
        endDate: queryArgs.options?.endDate ? new Date(queryArgs.options.endDate) : new Date()
    }), [queryArgs.options?.startDate, queryArgs.options?.endDate]);

    return <AMCList
        data={data?.data?.data ?? []}
        pagination={data?.data?.pagination ?? { total: 0, limit: 10, page: 1, pages: 0 }}
        changeFilter={handleFilterChange}
        onPageChange={handlePagination}
        currentPage={queryArgs.page ?? 1}
        initialClientFilter={queryArgs.client_id}
        initialProductFilter={queryArgs.product_id}
        onClientFilterChange={handleClientFilterChange}
        onProductFilterChange={handleProductFilterChange}
        activeFilters={queryArgs.filters}
        dateRangeSelector={dateRangeSelector}
        isLoading={isFetching}
        selectedFY={queryArgs.fy}
        onFYFilterChange={handleFYFilterChange}
        onCustomDateChange={handleCustomDateChange}
        companyData={filtersData?.data}
        totalAmount={{
            paid: data?.data?.total_amount?.paid ?? 0,
            pending: data?.data?.total_amount?.pending ?? 0,
            proforma: data?.data?.total_amount?.proforma ?? 0,
            invoice: data?.data?.total_amount?.invoice ?? 0,
            total: data?.data?.total_amount?.total ?? 0
        }}
    />
}

export default AMC