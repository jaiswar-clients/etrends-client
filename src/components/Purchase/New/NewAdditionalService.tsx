"use client"
import { useAddAdditionalServiceMutation } from '@/redux/api/order'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import AdditionalServiceForm, { IAdditionalServiceInputs } from '../Form/AdditionalServiceForm'
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck'

interface IProps {
    clientId: string
}

const NewAdditionalService: React.FC<IProps> = ({ clientId }) => {
    const [addAddtionalServiceApi, { isLoading }] = useAddAdditionalServiceMutation()
    const router = useRouter()
    const { debouncedCheck, checkOnSubmit, isLoading: isCheckingDuplicates } = useDuplicateCheck()

    const onSubmit = async (data: IAdditionalServiceInputs, orderId?: string) => {
        if (!orderId) return
        // Check for duplicates on submit
        await checkOnSubmit('additional-service', clientId, data)

        try {
            const resp = await addAddtionalServiceApi({ ...data, cost: Number(data.cost), order_id: orderId }).unwrap()
            toast({
                variant: 'success',
                title: 'Service Created Successfully',
                description: 'Service has been created successfully'
            })
            router.push(`/purchases?id=${resp.data._id}`)
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Something went wrong'
            })
        }
    }

    const handlePurchaseOrderNumberChange = (value: string) => {
        debouncedCheck('additional-service', clientId, { purchase_order_number: value }, true)
    }

    const handleInvoiceNumberChange = (value: string) => {
        debouncedCheck('additional-service', clientId, { invoice_number: value }, true)
    }

    const handleProductChange = (productId: string) => {
        debouncedCheck('additional-service', clientId, { product_id: productId }, true)
    }

    return (
        <AdditionalServiceForm
            clientId={clientId}
            label='New Additional Service'
            handler={onSubmit}
            isLoading={isLoading || isCheckingDuplicates}
            onPurchaseOrderNumberChange={handlePurchaseOrderNumberChange}
            onInvoiceNumberChange={handleInvoiceNumberChange}
            onProductChange={handleProductChange}
        />
    )
}

export default NewAdditionalService
