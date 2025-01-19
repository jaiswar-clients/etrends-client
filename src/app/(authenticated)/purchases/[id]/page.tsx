import PurchaseDetail from '@/components/Purchase/PurchaseDetail'
import { PURCHASE_TYPE } from '@/types/order'
import React, { use } from 'react'

const Page = ({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ type: string, client: string }> }) => {
    const { id: purchaseId } = use(params)
    const searchParamsObj = use(searchParams)
    const clientId = searchParamsObj.client
    const type = searchParamsObj.type as PURCHASE_TYPE

    return <PurchaseDetail id={purchaseId} type={type} clientId={clientId} />
}

export default Page