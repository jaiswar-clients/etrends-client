"use client"
import React from 'react'
import { useAddCustomizationMutation } from '@/redux/api/order'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import CustomizationForm, { ICustomizationInputs } from '../Form/CustomizationForm'

interface IProps {
    clientId: string
}

const NewCustomization: React.FC<IProps> = ({ clientId }) => {
    const [addCustomizationApi, { isLoading }] = useAddCustomizationMutation()

    const router = useRouter()

    const onSubmit = async (data: ICustomizationInputs, orderId?: string) => {
        // check if any required field empty and use toast to show error message
        if (!orderId) return
        try {
            const customization = await addCustomizationApi({ ...data, cost: Number(data.cost), order_id: orderId }).unwrap()
            toast({
                variant: 'success',
                title: 'Customization Created Successfully',
                description: 'Customization has been created successfully'
            })

            router.push(`/purchases?id=${customization.data._id}`)
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Something went wrong'
            })
        }
    }

    return <CustomizationForm label='New Customization' clientId={clientId} handler={onSubmit} isLoading={isLoading} />
}

export default NewCustomization
