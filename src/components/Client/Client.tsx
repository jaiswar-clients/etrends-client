"use client"
import React, { useState, useEffect } from 'react'
import Typography from '../ui/Typography'
import ClientList from './ClientList'
import { Button } from '../ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useGetClientsQuery } from '@/redux/api/client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const Client = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
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
        const initialProductFilter = searchParams?.get('product')
        const initialIndustryFilter = searchParams?.get('industry')
        const initialParentCompanyFilter = searchParams?.get('parentCompany')
        const urlPage = searchParams?.get('page')
        
        return {
            client: initialClientFilter || undefined,
            product: initialProductFilter || undefined,
            industry: initialIndustryFilter || undefined,
            parentCompany: initialParentCompanyFilter || undefined,
            page: urlPage ? parseInt(urlPage) : 1
        }
    })
    
    const { data, isSuccess, refetch, isFetching } = useGetClientsQuery({ 
        limit: 10, 
        page: queryArgs.page, 
        all: true 
    })
    
    // Effect to update URL when filters change
    useEffect(() => {
        const queryString = createQueryString({
            client: queryArgs.client,
            product: queryArgs.product,
            industry: queryArgs.industry,
            parentCompany: queryArgs.parentCompany,
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
        filterType: 'client' | 'product' | 'industry' | 'parentCompany',
        value: string | undefined
    ) => {
        setQueryArgs(prev => ({ ...prev, [filterType]: value, page: 1 })) // Reset page on filter change
    }
    
    const handlePageChange = (page: number) => {
        setQueryArgs(prev => ({ ...prev, page }))
    }
    
    return (
        <div>
            <div className="flex items-center justify-between">
                <Typography variant='h1' className='text-2xl md:text-3xl'>Client List</Typography>
                <Link passHref href={"/clients/add"}>
                    <Button>
                        <Plus />
                        Add Client
                    </Button>
                </Link>
            </div>

            <br />

            {
                isSuccess && (
                    <ClientList 
                        data={data?.data} 
                        initialFilters={queryArgs}
                        onFilterChange={handleFilterChange}
                        onPageChange={handlePageChange}
                        isLoading={isFetching}
                    />
                )
            }
        </div>
    )
}

export default Client