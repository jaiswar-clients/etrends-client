"use client"
import { useAddLicenseMutation } from '@/redux/api/order'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import LicenseForm, { ILicenseInputs } from '../Form/LicenseForm'
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck'

interface IProps {
    clientId: string
}

const NewLicense: React.FC<IProps> = ({ clientId }) => {
    const [addLicenseApi, { isLoading }] = useAddLicenseMutation()
    const router = useRouter()
    const { debouncedCheck, checkOnSubmit, isLoading: isCheckingDuplicates } = useDuplicateCheck()

    const onSubmit = async (data: ILicenseInputs, orderId?: string) => {
        if (!orderId) return
        // Check for duplicates on submit
        await checkOnSubmit('license', clientId, data)

        try {
            const license = await addLicenseApi({ ...data, total_license: Number(data.total_license), cost_per_license: Number(data.cost_per_license), order_id: orderId }).unwrap()
            toast({
                variant: "success",
                title: "License Added Successfully",
                description: "License has been added successfully"
            })
            router.push(`/purchases?id=${license.data._id}`)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || 'Something went wrong'
            })
        }
    }

    const handlePurchaseOrderNumberChange = (value: string) => {
        debouncedCheck('license', clientId, { purchase_order_number: value }, true)
    }

    const handleProductChange = (productId: string) => {
        debouncedCheck('license', clientId, { product_id: productId }, true)
    }

    return (
        <LicenseForm
            clientId={clientId}
            label='New License'
            handler={onSubmit}
            isLoading={isLoading || isCheckingDuplicates}
            onPurchaseOrderNumberChange={handlePurchaseOrderNumberChange}
            onProductChange={handleProductChange}
        />
    )
}
export default NewLicense