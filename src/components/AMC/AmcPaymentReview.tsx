import { IAMCPaymentReview, PAYMENT_STATUS_ENUM } from '@/types/order'
import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form'
import { Input } from '../ui/input'
import { useForm } from 'react-hook-form'
import DatePicker from '../ui/datepicker'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { ArrowUp, Trash } from 'lucide-react'
import { useAddAmcPaymentsMutation } from '@/redux/api/order'

const FREQUENCY_OPTIONS = [
    { value: 1, label: '1 Month' },
    { value: 3, label: '3 Months (Quarterly)' },
    { value: 6, label: '6 Months (Half Yearly)' },
    { value: 12, label: '12 Months (Yearly)' }
]

interface IProps {
    amcId: string
    data: IAMCPaymentReview[]
    handler: () => any
}

type IPaymentForm = IAMCPaymentReview

const getFrequencyLabel = (months: number): string => {
    const option = FREQUENCY_OPTIONS.find(opt => opt.value === months)
    return option?.label || `${months} Months`
}

const AmcPaymentReview: React.FC<IProps> = ({ amcId, data, handler }) => {
    const [selectedPayment, setSelectedPayment] = useState<IAMCPaymentReview | null>(null)
    const [updatedPayments, setUpdatedPayments] = useState<IAMCPaymentReview[]>(data)

    const [addAmcPaymentsApi, { isLoading }] = useAddAmcPaymentsMutation()

    const form = useForm<IPaymentForm>({
        defaultValues: {
            from_date: new Date(),
            to_date: new Date(),
            status: PAYMENT_STATUS_ENUM.PENDING,
            amc_rate_applied: 0,
            amc_rate_amount: 0,
            total_cost: 0,
            amc_frequency: 12 // Default to yearly
        }
    })

    // Get initial AMC rate
    const initialAmcRate = updatedPayments[0]?.amc_rate_applied || 0

    const onSubmit = (formData: IPaymentForm) => {
        try {
            const updatedPaymentIndex = updatedPayments.findIndex(
                payment =>
                    payment.from_date === selectedPayment?.from_date &&
                    payment.to_date === selectedPayment?.to_date
            )

            if (updatedPaymentIndex === -1) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Payment not found"
                })
                return
            }

            const newPayments = [...updatedPayments]
            newPayments[updatedPaymentIndex] = {
                ...newPayments[updatedPaymentIndex],
                ...formData
            }

            setUpdatedPayments(newPayments)
            setSelectedPayment(null)

            toast({
                variant: "success",
                title: "Payment Updated",
                description: "Payment has been updated successfully"
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Something went wrong"
            })
        }
    }

    const handleEdit = (payment: IAMCPaymentReview) => {
        setSelectedPayment(payment)
        form.reset({
            from_date: new Date(payment.from_date),
            to_date: new Date(payment.to_date),
            status: payment.status,
            amc_rate_applied: payment.amc_rate_applied,
            amc_rate_amount: payment.amc_rate_amount,
            total_cost: payment.total_cost,
            amc_frequency: payment.amc_frequency
        })
    }

    const handleDelete = (paymentToDelete: IAMCPaymentReview) => {
        try {
            const newPayments = updatedPayments.filter(
                payment => 
                    !(payment.from_date === paymentToDelete.from_date && 
                    payment.to_date === paymentToDelete.to_date)
            );
            
            setUpdatedPayments(newPayments);
            
            toast({
                variant: "success",
                title: "Payment Deleted",
                description: "Payment has been removed successfully"
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Something went wrong"
            });
        }
    }

    const onAddPayments = async () => {
        try {
            await addAmcPaymentsApi({
                amcId,
                payments: updatedPayments

            }).unwrap()
            toast({
                variant: "success",
                title: "Payments Added",
                description: "Payments have been added successfully"
            })

            handler()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Something went wrong"
            })
        }

    }


    return (
        <div className="space-y-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Sr No.</TableHead>
                        <TableHead>From Date</TableHead>
                        <TableHead>To Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>AMC Rate (%)</TableHead>
                        <TableHead>AMC Amount</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {updatedPayments.map((payment, index) => (
                        <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{new Date(payment.from_date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(payment.to_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={payment.status === PAYMENT_STATUS_ENUM.PAID ? 'success' : 'destructive'}
                                    className="capitalize"
                                >
                                    {payment.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    {payment.amc_rate_applied}%
                                    {payment.amc_rate_applied > initialAmcRate && (
                                        <Badge variant="outline" className="bg-green-50">
                                            <ArrowUp className="w-3 h-3 text-green-600" />
                                            {((payment.amc_rate_applied - initialAmcRate))}%
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>₹{payment.amc_rate_amount.toLocaleString()}</TableCell>
                            <TableCell>₹{payment.total_cost.toLocaleString()}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">
                                    {getFrequencyLabel(payment.amc_frequency)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(payment)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(payment)}
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
                <DialogContent>
                    <DialogTitle>Update Payment</DialogTitle>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="from_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From Date</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    date={field.value}
                                                    onDateChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="to_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To Date</FormLabel>
                                            <FormControl>
                                                <DatePicker
                                                    date={field.value}
                                                    onDateChange={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Object.values(PAYMENT_STATUS_ENUM).map((status) => (
                                                        <SelectItem key={status} value={status}>
                                                            {status}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amc_frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AMC Frequency</FormLabel>
                                            <Select
                                                onValueChange={(value) => field.onChange(Number(value))}
                                                defaultValue={field.value.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select frequency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {FREQUENCY_OPTIONS.map((option) => (
                                                        <SelectItem
                                                            key={option.value}
                                                            value={option.value.toString()}
                                                        >
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="amc_rate_applied"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AMC Rate (%)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amc_rate_amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AMC Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={e => field.onChange(Number(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="total_cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Cost</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setSelectedPayment(null)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    Update Payment
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <div className="flex justify-end">
                <Button type="button" onClick={onAddPayments} loading={{ isLoading, loader: "tailspin" }}>
                    Add Payments
                </Button>
            </div>

        </div>
    )
}

export default AmcPaymentReview