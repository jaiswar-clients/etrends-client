"use client"
import CreateProduct from '@/components/Product/Create/CreateProduct'
import Typography from '@/components/ui/Typography'
import { toast } from '@/hooks/use-toast'
import { useCreateProductMutation } from '@/redux/api/product'
import { IProduct } from '@/types/product'
import React from 'react'

const Page = () => {
    const [createProductApi] = useCreateProductMutation()

    const createProductHandler = async (data: Omit<IProduct, '_id'>): Promise<void> => {
        try {
            await createProductApi(data).unwrap()
            toast({
                variant: "default",
                title: "Product Created",
            })
            
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while adding a product",
                description: error?.message || `Please try again and if error still persist contact the developer`
            })
            console.error("Error submitting")
        }
    }

    return (
        <div>
            <Typography variant='h1' className='text-3xl'>Create New Product</Typography>

            <CreateProduct handler={createProductHandler} />
        </div>
    )
}

export default Page
