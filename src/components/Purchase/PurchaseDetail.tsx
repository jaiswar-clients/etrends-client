"use client"
import {
    useGetAdditionalServiceByIdQuery,
    useGetCustomizationByIdQuery,
    useGetLicenceByIdQuery,
    useGetOrderByIdQuery,
    useUpdateAdditionalServiceByIdMutation,
    useUpdateCustomizationByIdMutation,
    useUpdateLicenseByIdMutation,
    useUpdateOrderMutation,
    useDeleteLicenseByIdMutation,
    useDeleteCustomizationByIdMutation,
    useDeleteAdditionalServiceByIdMutation
} from '@/redux/api/order'

import React, { useState } from 'react'
import OrderDetail from '../Client/Add/Form/OrderDetail'
import { toast } from '@/hooks/use-toast'
import { OrderDetailInputs, PURCHASE_TYPE } from '@/types/order'
import CustomizationForm, { ICustomizationInputs } from './Form/CustomizationForm'
import LicenseForm, { ILicenseInputs } from './Form/LicenseForm'
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

interface IProps {
    id: string,
    type: PURCHASE_TYPE
    clientId: string
}

type DeleteConfirmState = {
    show: boolean;
    type: 'license' | 'customization' | 'additional_service' | null;
    id: string | null;
    name: string;
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

    const [deleteLicense, { isLoading: isDeleteLicenseLoading }] = useDeleteLicenseByIdMutation()
    const [deleteCustomization, { isLoading: isDeleteCustomizationLoading }] = useDeleteCustomizationByIdMutation()
    const [deleteAdditionalService, { isLoading: isDeleteAdditionalServiceLoading }] = useDeleteAdditionalServiceByIdMutation()

    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
        show: false,
        type: null,
        id: null,
        name: '',
    })

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
            
        } catch (error: any) {
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
            await updateCustomizationApi({ ...data, id: customizationData?.data._id }).unwrap()
            toast({
                variant: "success",
                title: "Order Updated",
            })
            
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
            await updateLicenseByIdApi({ ...data, cost_per_license: Number(data.cost_per_license), total_license: Number(data.total_license), id }).unwrap()
            toast({
                variant: "success",
                title: "Order Updated",
            })
            
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
            await updateAdditionalServiceApi({ ...data, cost: Number(data.cost), id }).unwrap()
            toast({
                variant: "success",
                title: "Order Updated",
            })
            
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while adding a client",
                description: error?.message || `Please try again and if error still persist contact the developer`
            })
        }
    }

    const handleDelete = async () => {
        if (!deleteConfirm.id || !deleteConfirm.type) return
        try {
            switch (deleteConfirm.type) {
                case 'license':
                    await deleteLicense(deleteConfirm.id).unwrap()
                    break
                case 'customization':
                    await deleteCustomization(deleteConfirm.id).unwrap()
                    break
                case 'additional_service':
                    await deleteAdditionalService(deleteConfirm.id).unwrap()
                    break
            }
            toast({
                variant: "success",
                title: `${deleteConfirm.name} deleted successfully`,
            })
            setDeleteConfirm({ show: false, type: null, id: null, name: '' })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error deleting item",
                description: error?.data?.message || error?.message || "Please try again"
            })
        }
    }

    const isDeleting = isDeleteLicenseLoading || isDeleteCustomizationLoading || isDeleteAdditionalServiceLoading

    const renderChildItems = () => {
        const order = orderData?.data;
        if (!order || type !== PURCHASE_TYPE.ORDER) return null;

        const licenses = (order as any).licenses || [];
        const customizations = (order as any).customizations || [];
        const additionalServices = (order as any).additional_services || [];

        return (
            <div className="space-y-6 mt-6">
                {licenses.length > 0 && (
                    <div className="border rounded-lg p-4 bg-white">
                        <h3 className="text-lg font-semibold mb-3">Licenses</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Total Licenses</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">AMC Rate</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {licenses.map((license: any) => (
                                    <TableRow key={license._id}>
                                        <TableCell>{license.total_license ?? '-'}</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency((license.rate?.amount || 0) * (license.total_license || 0))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {license.amc_rate?.percentage ?? 0}% ({formatCurrency(license.amc_rate?.amount || 0)})
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteConfirm({
                                                    show: true,
                                                    type: 'license',
                                                    id: license._id,
                                                    name: 'License',
                                                })}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {customizations.length > 0 && (
                    <div className="border rounded-lg p-4 bg-white">
                        <h3 className="text-lg font-semibold mb-3">Customizations</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">AMC Rate</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customizations.map((customization: any) => (
                                    <TableRow key={customization._id}>
                                        <TableCell>{customization.title || '-'}</TableCell>
                                        <TableCell className="capitalize">{customization.type || '-'}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(customization.cost || 0)}</TableCell>
                                        <TableCell className="text-right">
                                            {customization.amc_rate?.percentage ?? 0}% ({formatCurrency(customization.amc_rate?.amount || 0)})
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteConfirm({
                                                    show: true,
                                                    type: 'customization',
                                                    id: customization._id,
                                                    name: customization.title || 'Customization',
                                                })}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {additionalServices.length > 0 && (
                    <div className="border rounded-lg p-4 bg-white">
                        <h3 className="text-lg font-semibold mb-3">Additional Services</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">AMC Rate</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {additionalServices.map((service: any) => (
                                    <TableRow key={service._id}>
                                        <TableCell>{service.name || '-'}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(service.cost || 0)}</TableCell>
                                        <TableCell className="text-right">
                                            {service.amc_rate?.percentage ?? 0}% ({formatCurrency(service.amc_rate?.amount || 0)})
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteConfirm({
                                                    show: true,
                                                    type: 'additional_service',
                                                    id: service._id,
                                                    name: service.name || 'Additional Service',
                                                })}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        );
    };

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
                        {renderChildItems()}
                        {renderAMCBreakdown()}
                    </div>
                )
            case PURCHASE_TYPE.CUSTOMIZATION:
                return (
                    <div>
                        {customizationData?.data._id && (
                            <div className="flex justify-end mb-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteConfirm({
                                        show: true,
                                        type: 'customization',
                                        id: customizationData.data._id,
                                        name: customizationData.data.title || 'Customization',
                                    })}
                                >
                                    <Trash2 className="h-4 w-4" /> Delete
                                </Button>
                            </div>
                        )}
                        <CustomizationForm label='Customization Detail' isLoading={isCustomizationApiLoading} handler={updateCustomizationHandler} defaultValue={customizationData?.data} clientId={clientId} disable={true} />
                    </div>
                )
            case PURCHASE_TYPE.LICENSE:
                return (
                    <div>
                        {licenseData?.data._id && (
                            <div className="flex justify-end mb-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteConfirm({
                                        show: true,
                                        type: 'license',
                                        id: licenseData.data._id,
                                        name: 'License',
                                    })}
                                >
                                    <Trash2 className="h-4 w-4" /> Delete
                                </Button>
                            </div>
                        )}
                        <LicenseForm label='License Detail' isLoading={isUpdateLicenseApiLoading} handler={updateLicenseHandler} clientId={clientId} disable={true} defaultValue={licenseData?.data} />
                    </div>
                )
            case PURCHASE_TYPE.ADDITIONAL_SERVICE:
                return (
                    <div>
                        {additionalServiceData?.data._id && (
                            <div className="flex justify-end mb-2">
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeleteConfirm({
                                        show: true,
                                        type: 'additional_service',
                                        id: additionalServiceData.data._id,
                                        name: additionalServiceData.data.name || 'Additional Service',
                                    })}
                                >
                                    <Trash2 className="h-4 w-4" /> Delete
                                </Button>
                            </div>
                        )}
                        <AdditionalServiceForm label='Additional Service Detail' isLoading={isUpdateAdditionalServiceLoading} handler={updateAdditionalServiceHandler} clientId={clientId} disable={true} defaultValue={additionalServiceData?.data} />
                    </div>
                )
            default:
                return <div>Order</div>
        }
    }

    return (
        <>
            {renderPurchaseDetail()}
            <Dialog open={deleteConfirm.show} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, show: open }))}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete {deleteConfirm.name}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this {deleteConfirm.type?.replace('_', ' ')}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button variant="outline" onClick={() => setDeleteConfirm(prev => ({ ...prev, show: false }))}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            loading={{ isLoading: isDeleting, loader: "tailspin" }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default PurchaseDetail