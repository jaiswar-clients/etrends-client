"use client"
import OrderDetail from '@/components/Client/Add/Form/OrderDetail'
import Typography from '@/components/ui/Typography'
import { toast } from '@/hooks/use-toast'
import { useCreateOrderMutation } from '@/redux/api/order'
import { OrderDetailInputs } from '@/types/order'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck'

interface IProps {
  clientId: string
}

const NewOrder: React.FC<IProps> = ({ clientId }) => {
  const [createOrderApi, { isLoading }] = useCreateOrderMutation()
  const router = useRouter()
  const { debouncedCheck, checkOnSubmit, isLoading: isCheckingDuplicates } = useDuplicateCheck({
    debounceMs: 500,
  })

  const createNewOrderHandler = async (data: OrderDetailInputs) => {
    // Check for duplicates on submit
    await checkOnSubmit('order', clientId, data)

    try {
      const order = await createOrderApi({ ...data, client_id: clientId }).unwrap()
      toast({
        variant: 'success',
        title: 'Order Created Successfully',
        description: 'Order has been created successfully'
      })
      router.push(`/purchases?id=${order.data._id}`)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Something went wrong'
      })
    }
  }

  const handlePurchaseOrderNumberChange = (value: string) => {
    debouncedCheck('order', clientId, { purchase_order_number: value }, true)
  }

  const handleProductsChange = (products: any[]) => {
    debouncedCheck('order', clientId, { products: products.map(p => p._id) }, true)
  }

  return (
    <div>
      <Typography variant='h1' className='text-3xl'>Create New Order</Typography>

      <br />
      <OrderDetail
        isLoading={isLoading || isCheckingDuplicates}
        removeAccordion
        handler={createNewOrderHandler}
        onPurchaseOrderNumberChange={handlePurchaseOrderNumberChange}
        onProductsChange={handleProductsChange}
      />
    </div>
  )
}

export default NewOrder