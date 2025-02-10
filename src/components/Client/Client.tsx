"use client"
import React from 'react'
import Typography from '../ui/Typography'
import ClientList from './ClientList'
import { Button } from '../ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useGetClientsQuery } from '@/redux/api/client'

const Client = () => {
    const { data, isSuccess } = useGetClientsQuery({ limit: 10, page: 1, all: true })
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
                    <ClientList data={data?.data} />
                )
            }
        </div>
    )
}

export default Client