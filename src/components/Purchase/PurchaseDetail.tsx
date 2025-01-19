"use client"
import {
    useGetAdditionalServiceByIdQuery,
    useGetCustomizationByIdQuery,
    useGetLicenceByIdQuery,
    useGetOrderByIdQuery,
    useUpdateAdditionalServiceByIdMutation,
    useUpdateCustomizationByIdMutation,
    useUpdateLicenseByIdMutation,
    useUpdateOrderMutation
} from '@/redux/api/order'

import React from 'react'
import OrderDetail from '../Client/Add/Form/OrderDetail'
import { toast } from '@/hooks/use-toast'
import { OrderDetailInputs, PURCHASE_TYPE } from '@/types/order'
import CustomizationForm, { ICustomizationInputs } from './Form/CustomizationForm'
import LicenseForm, { ILicenseInputs } from './Form/LicenseForm'
import { useRouter } from 'next/navigation'
import AdditionalServiceForm, { IAdditionalServiceInputs } from './Form/AdditionalServiceForm'

interface IProps {
    id: string,
    type: PURCHASE_TYPE
    clientId: string
}

const PurchaseDetail: React.FC<IProps> = ({ id, type, clientId }) => {
    const { data: orderData } = useGetOrderByIdQuery(id, { skip: type !== PURCHASE_TYPE.ORDER })
    const { data: customizationData } = useGetCustomizationByIdQuery(id, { skip: type !== PURCHASE_TYPE.CUSTOMIZATION })
    const { data: licenseData } = useGetLicenceByIdQuery(id, { skip: type !== PURCHASE_TYPE.LICENSE })
    const { data: additionalServiceData } = useGetAdditionalServiceByIdQuery(id, { skip: type !== PURCHASE_TYPE.ADDITIONAL_SERVICE })

    const [updateFirstOrderApi, { isLoading: isUpdateOrderLoading }] = useUpdateOrderMutation()
    const [updateCustomizationApi, { isLoading: isCustomizationApiLoading }] = useUpdateCustomizationByIdMutation()
    const [updateLicenseByIdApi, { isLoading: isUpdateLicenseApiLoading }] = useUpdateLicenseByIdMutation()
    const [updateAdditionalServiceApi, { isLoading: isUpdateAdditionalServiceLoading }] = useUpdateAdditionalServiceByIdMutation()

    const router = useRouter()

    const updateOrderHandler = async (data: OrderDetailInputs) => {
        if (!orderData?.data._id) {
            toast({
                variant: "destructive",
                title: "Error Occured while updating a client",
                description: "Please create a first order before updating"
            })
            return
        }

        try {
            await updateFirstOrderApi({ ...data, orderId: orderData?.data._id }).unwrap()
            toast({
                variant: "success",
                title: "Order Updated",
            })
            router.push(`/purchases?id=${orderData?.data._id}`)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while adding a client",
                description: error?.message || `Please try again and if error still persist contact the developer`
            })
        }
    }

    const updateCustomizationHandler = async (data: ICustomizationInputs) => {
        if (!customizationData?.data._id) {
            toast({
                variant: "destructive",
                title: "Error Occured while updating a client",
                description: "Please create a first order before updating"
            })
            return
        }

        try {
            const resp = await updateCustomizationApi({ ...data, id: customizationData?.data._id }).unwrap()
            toast({
                variant: "success",
                title: "Order Updated",
            })
            router.push(`/purchases?id=${resp.data._id}`)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while adding a client",
                description: error?.message || `Please try again and if error still persist contact the developer`
            })
        }
    }

    const updateLicenseHandler = async (data: ILicenseInputs) => {
        try {
            const resp = await updateLicenseByIdApi({ ...data, cost_per_license: Number(data.cost_per_license), total_license: Number(data.total_license), id }).unwrap()
            toast({
                variant: "success",
                title: "Order Updated",
            })
            router.push(`/purchases?id=${resp.data._id}`)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while adding a client",
                description: error?.message || `Please try again and if error still persist contact the developer`
            })
        }
    }

    const updateAdditionalServiceHandler = async (data: IAdditionalServiceInputs) => {
        try {
            const resp = await updateAdditionalServiceApi({ ...data, cost: Number(data.cost), id }).unwrap()
            toast({
                variant: "success",
                title: "Order Updated",
            })
            router.push(`/purchases?id=${resp.data._id}`)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while adding a client",
                description: error?.message || `Please try again and if error still persist contact the developer`
            })
        }
    }

    const renderPurchaseDetail = () => {
        switch (type) {
            case PURCHASE_TYPE.ORDER:
                return <OrderDetail isLoading={isUpdateOrderLoading} title="Order Detail" handler={async () => { }} defaultValue={orderData?.data} updateHandler={updateOrderHandler} defaultOpen={true} />
            case PURCHASE_TYPE.CUSTOMIZATION:
                return <CustomizationForm label='Customization Detail' isLoading={isCustomizationApiLoading} handler={updateCustomizationHandler} defaultValue={customizationData?.data} clientId={clientId} disable={true} />
            case PURCHASE_TYPE.LICENSE:
                return <LicenseForm label='License Detail' isLoading={isUpdateLicenseApiLoading} handler={updateLicenseHandler} clientId={clientId} disable={true} defaultValue={licenseData?.data} />
            case PURCHASE_TYPE.ADDITIONAL_SERVICE:
                return <AdditionalServiceForm label='Additional Service Detail' isLoading={isUpdateAdditionalServiceLoading} handler={updateAdditionalServiceHandler} clientId={clientId} disable={true} defaultValue={additionalServiceData?.data} />
            default:
                return <div>Order</div>
        }
    }

    return renderPurchaseDetail()
}

export default PurchaseDetail