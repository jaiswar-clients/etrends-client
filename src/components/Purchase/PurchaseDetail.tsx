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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

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
            // Handle error message which might be an array or string
            let errorMessage = 'Something went wrong'
            if (error?.data?.message) {
                if (Array.isArray(error.data.message)) {
                    errorMessage = error.data.message.join(', ')
                } else {
                    errorMessage = error.data.message
                }
            } else if (error?.message) {
                errorMessage = error.message
            }

            toast({
                variant: "destructive",
                title: "Error Occured while updating order",
                description: errorMessage || `Please try again and if error still persist contact the developer`
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

    const renderAMCBreakdown = () => {
        const order = orderData?.data;
        if (!order || type !== PURCHASE_TYPE.ORDER) return null;

        const baseAmc = order.amc_rate?.amount || 0;
        const basePercentage = order.amc_rate?.percentage || 0;

        const customizationRows = (order.customizations || [])
            .filter((c) => c.amc_rate && c.amc_rate.amount > 0)
            .map((c) => ({
                label: c.title || "Customization",
                amount: c.amc_rate!.amount,
                percentage: c.amc_rate!.percentage,
            }));

        const licenseRows = (order.licenses || [])
            .filter((l) => l.amc_rate && l.amc_rate.amount > 0)
            .map((l) => ({
                label: "License",
                amount: l.amc_rate!.amount,
                percentage: l.amc_rate!.percentage,
            }));

        const totalAmc =
            baseAmc +
            customizationRows.reduce((sum, r) => sum + r.amount, 0) +
            licenseRows.reduce((sum, r) => sum + r.amount, 0);

        return (
            <div className="mt-6 border rounded-lg p-4 bg-white">
                <h3 className="text-lg font-semibold mb-3">AMC Breakdown</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Component</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">Base AMC</TableCell>
                            <TableCell className="text-right">{basePercentage}%</TableCell>
                            <TableCell className="text-right">{formatCurrency(baseAmc)}</TableCell>
                        </TableRow>
                        {customizationRows.map((row, idx) => (
                            <TableRow key={`customization-${idx}`}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell className="text-right">{row.percentage}%</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                            </TableRow>
                        ))}
                        {licenseRows.map((row, idx) => (
                            <TableRow key={`license-${idx}`}>
                                <TableCell>{row.label}</TableCell>
                                <TableCell className="text-right">{row.percentage}%</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-gray-50">
                            <TableCell>Total AMC</TableCell>
                            <TableCell className="text-right">—</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalAmc)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    };

    const renderPurchaseDetail = () => {
        switch (type) {
            case PURCHASE_TYPE.ORDER:
                return (
                    <div>
                        <OrderDetail isLoading={isUpdateOrderLoading} title="Order Detail" handler={async () => { }} defaultValue={orderData?.data} updateHandler={updateOrderHandler} defaultOpen={true} />
                        {renderAMCBreakdown()}
                    </div>
                )
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