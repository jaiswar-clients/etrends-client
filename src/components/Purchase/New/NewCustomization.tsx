"use client"
import React from 'react'
import { useAddCustomizationMutation } from '@/redux/api/order'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import CustomizationForm, { ICustomizationInputs } from '../Form/CustomizationForm'
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck'

interface IProps {
    clientId: string
}

const NewCustomization: React.FC<IProps> = ({ clientId }) => {
    const [addCustomizationApi, { isLoading }] = useAddCustomizationMutation()

    const router = useRouter()
    const { debouncedCheck, checkOnSubmit, isLoading: isCheckingDuplicates } = useDuplicateCheck()

    const onSubmit = async (data: ICustomizationInputs, orderId?: string) => {
        // check if any required field empty and use toast to show error message
        if (!orderId) return
        // Check for duplicates on submit
        await checkOnSubmit('customization', clientId, data)

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

    const handlePurchaseOrderNumberChange = (value: string) => {
        debouncedCheck('customization', clientId, { purchase_order_number: value }, true)
    }

    const handleInvoiceNumberChange = (value: string) => {
        debouncedCheck('customization', clientId, { invoice_number: value }, true)
    }

    const handleProductChange = (productId: string) => {
        debouncedCheck('customization', clientId, { product_id: productId }, true)
    }

    return (
        <CustomizationForm
            label='New Customization'
            clientId={clientId}
            handler={onSubmit}
            isLoading={isLoading || isCheckingDuplicates}
            onPurchaseOrderNumberChange={handlePurchaseOrderNumberChange}
            onInvoiceNumberChange={handleInvoiceNumberChange}
            onProductChange={handleProductChange}
        />
    )
}

export default NewCustomization
