import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import Typography from '@/components/ui/Typography'
import { ORDER_STATUS_ENUM } from '@/types/client'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import ProductDropdown from '@/components/common/ProductDropdown'
import { AmountInput } from '@/components/ui/AmountInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import DatePicker from '@/components/ui/datepicker'
import { CircleCheck, CirclePlus, CircleX, Edit, File, IndianRupee, Trash2, Wrench, X, History, Clock } from 'lucide-react'
import { Separator } from '@radix-ui/react-separator'
import { useToast } from '@/hooks/use-toast'
import { IPaymentTerm, LicenseDetails, OrderDetailInputs } from '@/types/order'
import { useAppSelector } from '@/redux/hook'
import { IOrderObject, PAYMENT_STATUS_ENUM, useDeleteOrderByIdMutation } from '@/redux/api/order'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link'
import { IProduct } from '@/types/product'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { useFileUpload } from '@/hooks/useFileUpload'
import { formatCurrency } from '@/lib/utils'
import ShowMultipleFilesModal from '@/components/common/ShowMultipleFiles'
import { useRouter } from 'next/navigation'

interface OrderProps {
    title?: string
    handler: (data: OrderDetailInputs) => Promise<void>
    defaultValue?: IOrderObject
    updateHandler?: (data: OrderDetailInputs) => Promise<void>
    removeAccordion?: boolean
    defaultOpen?: boolean
    isLoading: boolean
}

const StatusOptions = [
    {
        id: 0,
        label: () =>
            <div className='flex justify-start items-center gap-2'>
                <span className="bg-green-500 w-2.5 h-2.5 rounded-full"></span>
                <span>Active</span>
            </div>
        ,
        value: ORDER_STATUS_ENUM.ACTIVE,
    },
    {
        id: 1,
        label: () => < div className='flex justify-start items-center gap-2' >
            <span className="bg-red-500 w-2.5 h-2.5 rounded-full"></span>
            <span>Inactive</span>
        </div>,
        value: ORDER_STATUS_ENUM.INACTIVE,
    },
]


type RenderFormFieldNameType = keyof OrderDetailInputs | keyof LicenseDetails |
    `payment_terms.${number}.${keyof OrderDetailInputs['payment_terms'][number]}` |
    `agreements.${number}.${keyof OrderDetailInputs['agreements'][number]}` |
    `base_cost_seperation.${number}.${'product_id' | 'percentage' | 'amount'}`
    | `other_documents.${number}.url` | `other_documents.${number}.title`


const OrderDetail: React.FC<OrderProps> = ({ title, handler, defaultValue, updateHandler, removeAccordion, defaultOpen = false, isLoading = false }) => {
    const [disableInput, setDisableInput] = useState(false);
    const [isPercentage, setIsPercentage] = useState({ amc_rate: true })
    const [showAmcHistoryModal, setShowAmcHistoryModal] = useState(false);
    const [amcHistoryDate, setAmcHistoryDate] = useState<Date>(new Date());
    const [initialAmcRate, setInitialAmcRate] = useState<{ percentage: number; amount: number } | null>(null);
    const [initialStatus, setInitialStatus] = useState<ORDER_STATUS_ENUM | null>(null);
    const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
    const [statusChangeDate, setStatusChangeDate] = useState<Date>(new Date());
    const [showStatusLogsModal, setShowStatusLogsModal] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showAmcRateHistoryModal, setShowAmcRateHistoryModal] = useState(false);
    const [initialAmcStartDate, setInitialAmcStartDate] = useState<Date | null>(null);
    const [showAmcStartChangeModal, setShowAmcStartChangeModal] = useState(false);
    const [amcStartChangeDate, setAmcStartChangeDate] = useState<Date>(new Date());
    const [showAmcStartLogsModal, setShowAmcStartLogsModal] = useState(false);

    const router = useRouter();
    const { uploadFile, getFileNameFromUrl } = useFileUpload()
    const { toast } = useToast()
    const { products } = useAppSelector(state => state.user)
    const { user } = useAppSelector(state => state.user)

    const [deleteOrderById, { isLoading: isDeleting }] = useDeleteOrderByIdMutation();

    const amcHistoryForm = useForm({
        defaultValues: {
            change_date: amcHistoryDate
        }
    });

    const statusChangeForm = useForm({
        defaultValues: {
            change_date: statusChangeDate
        }
    });

    const amcStartChangeForm = useForm({
        defaultValues: {
            change_date: amcStartChangeDate
        }
    });

    useEffect(() => {
        if (defaultValue?._id) {
            setDisableInput(true)
            setInitialAmcRate(defaultValue.amc_rate);
            setInitialStatus(defaultValue.status as ORDER_STATUS_ENUM);
            setInitialAmcStartDate(defaultValue.amc_start_date ? new Date(defaultValue.amc_start_date) : null);
        }
    }, [defaultValue])

    const defaultValues = {
        products: [],
        base_cost: 0,
        amc_rate: defaultValue?.amc_rate || {
            percentage: 20,
            amount: 0,
        },
        status: ORDER_STATUS_ENUM.ACTIVE,
        training_and_implementation_cost: 0,
        payment_terms: defaultValue?.payment_terms ?
            defaultValue.payment_terms.map(term => ({
                ...term,
                payment_receive_date: term.payment_receive_date ? new Date(term.payment_receive_date) : undefined,
                invoice_date: term.invoice_date ? new Date(term.invoice_date) : undefined,
            })) : [
                {
                    name: "Deployment",
                    percentage_from_base_cost: 0,
                    calculated_amount: 0,
                    invoice_document: "",
                    invoice_number: "",
                    invoice_date: undefined,
                    status: PAYMENT_STATUS_ENUM.PENDING,
                    payment_receive_date: undefined
                },
                {
                    name: "UAT Sign off",
                    percentage_from_base_cost: 0,
                    calculated_amount: 0,
                    invoice_document: "",
                    invoice_number: "",
                    invoice_date: undefined,
                    status: PAYMENT_STATUS_ENUM.PENDING,
                    payment_receive_date: undefined
                },
                {
                    name: "Production Live Instance",
                    percentage_from_base_cost: 0,
                    calculated_amount: 0,
                    invoice_document: "",
                    invoice_number: "",
                    invoice_date: undefined,
                    status: PAYMENT_STATUS_ENUM.PENDING,
                    payment_receive_date: undefined
                },
            ],
        agreements: [],
        total_cost: 0,
        license: "",
        cost_per_license: 0,
        amc_rate_change_frequency_in_years: 0,
        invoice_document: "",
        total_license: 0,
        licenses_with_base_price: 0,
        purchased_date: new Date(),
        amc_rate_history: [],
        status_logs: [],
        amc_start_logs: []
    }

    const values = useMemo(() => defaultValue ? {
        products: defaultValue.products || [],
        base_cost: defaultValue.base_cost,
        amc_rate: defaultValue.amc_rate,
        status: defaultValue.status as ORDER_STATUS_ENUM,
        training_and_implementation_cost: defaultValue.training_and_implementation_cost || 0,
        payment_terms: defaultValue.payment_terms.map(term => ({ ...term, invoice_date: term.invoice_date ? new Date(term.invoice_date) : undefined, payment_receive_date: term.payment_receive_date ? new Date(term.payment_receive_date) : undefined })),
        agreements: defaultValue.agreements,
        cost_per_license: defaultValue.cost_per_license || 0,
        licenses_with_base_price: defaultValue.licenses_with_base_price || 0,
        amc_start_date: new Date(defaultValue.amc_start_date),
        other_documents: defaultValue?.other_documents || [],
        purchase_order_document: defaultValue.purchase_order_document || "",
        purchased_date: new Date(defaultValue.purchased_date || new Date()),
        amc_rate_history: defaultValue.amc_rate_history || [],
        amc_rate_change_frequency_in_years: defaultValue.amc_rate_change_frequency_in_years || 0,
        status_logs: defaultValue.status_logs || [],
        amc_start_logs: (defaultValue.amc_start_logs || []).map(log => ({
            ...log,
            from: log.from ? new Date(log.from) : undefined,
            to: log.to ? new Date(log.to) : undefined,
            date: log.date ? new Date(log.date) : undefined,
        })),
    } : undefined, [defaultValue])


    const form = useForm<OrderDetailInputs & LicenseDetails>({
        defaultValues,
        ...(defaultValue && {
            values
        })
    })

    const { fields: baseCostSeparationFields, append: appendBaseCostSeperation, remove: removebaseCostSeparation } = useFieldArray({
        control: form.control,
        name: "base_cost_seperation"
    });

    const { fields: paymentTermsFields, append: appendPaymentTerm, remove: removePaymentTerm } = useFieldArray({
        control: form.control,
        name: "payment_terms"
    });

    const appendAgreementDateFields = (newAgreement: { start: Date, end: Date, document: string }) => {
        const currentAgreements = form.getValues("agreements") || [];
        form.setValue("agreements", [...currentAgreements, newAgreement]);
    }

    const removeAgreementDateField = (indexToRemove: number) => {
        const currentAgreements = form.getValues("agreements") || [];
        form.setValue("agreements", currentAgreements.filter((_, index) => index !== indexToRemove));
    }

    const agreementsData = form.watch("agreements")
    const amcStartLogs = form.watch("amc_start_logs")

    const addPaymentTerm = () => {
        appendPaymentTerm({
            name: "",
            percentage_from_base_cost: 0,
            calculated_amount: 0,
            payment_receive_date: undefined,
            invoice_date: undefined,
            invoice_document: "",
            invoice_number: "",
        });
    };

    const handlePaymentTermChange = (index: number, value: number, field: 'percentage_from_base_cost' | 'calculated_amount') => {
        const baseCost = Number(form.getValues("base_cost")) || 0;
        const trainingCost = Number(form.getValues("training_and_implementation_cost")) || 0;
        const totalCost = baseCost + trainingCost;

        if (field === 'percentage_from_base_cost') {
            const percentage = value || 0;
            const calculatedAmount = (totalCost * percentage) / 100;
            form.setValue(`payment_terms.${index}.percentage_from_base_cost`, value);
            form.setValue(`payment_terms.${index}.calculated_amount`, calculatedAmount);
        } else {
            const amount = value || 0;
            const calculatedPercentage = ((amount / totalCost) * 100).toFixed(2);
            form.setValue(`payment_terms.${index}.calculated_amount`, amount);
            form.setValue(`payment_terms.${index}.percentage_from_base_cost`, parseFloat(calculatedPercentage));
        }
    };

    // Function to recalculate all payment terms
    const recalculatePaymentTerms = (baseCost: number, trainingCost: number = Number(form.getValues("training_and_implementation_cost")) || 0) => {
        if (!baseCost && !trainingCost) return;
        const totalCost = Number(baseCost) + Number(trainingCost);
        const paymentTerms = form.getValues("payment_terms");
        
        paymentTerms.forEach((term, index) => {
            const percentage = Number(term.percentage_from_base_cost) || 0;
            if (!percentage) return;
            const calculatedAmount = (totalCost * percentage) / 100;
            form.setValue(`payment_terms.${index}.calculated_amount`, calculatedAmount);
        });
    };

    const reCalculateBaseSeperationCost = (baseCost: number) => {
        baseCostSeparationFields.forEach((field, index) => {
            const percentage = Number(field.percentage) || 0;
            if (!percentage) return;
            const calculatedAmount = (Number(baseCost) * percentage) / 100;
            form.setValue(`base_cost_seperation.${index}.amount`, calculatedAmount);
        });
    }

    const recalculateAMCRateBasedOnBaseCost = (baseCost: number) => {
        const currentAmcRate = form.getValues("amc_rate");
        const amcPercentage = Number(currentAmcRate.percentage) || 0;

        const amcTotalCost = Number(baseCost);
        const calculatedAmount = (amcTotalCost / 100) * amcPercentage;

        form.setValue("amc_rate.amount", calculatedAmount);
    };

    const recalculateAMCRate = (value: number, field: 'percentage' | 'amount') => {
        const baseCost = Number(form.getValues("base_cost")) || 0;

        if (!baseCost) return;
        // Calculate total cost including base cost, license cost and customization
        const amcTotalCost = baseCost;

        if (field === 'percentage') {
            const percentage = value || 0;
            const calculatedAmount = (amcTotalCost * percentage) / 100;
            form.setValue(`amc_rate.percentage`, value);
            form.setValue(`amc_rate.amount`, calculatedAmount);
        } else {
            const amount = value || 0;
            const calculatedPercentage = ((amount / amcTotalCost) * 100).toFixed(2);
            form.setValue(`amc_rate.amount`, amount);
            form.setValue(`amc_rate.percentage`, parseFloat(calculatedPercentage));
        }
    }

    const calculateTotalCost = () => {
        // Use parseFloat to handle string inputs and ensure numeric values
        const baseCost = parseFloat(form.getValues("base_cost")?.toString() || "0");
        const trainingAndImplementationCost = parseFloat(form.getValues("training_and_implementation_cost")?.toString() || "0");

        // Handle negative values by using Math.max
        const sanitizedBaseCost = Math.max(0, baseCost);
        const sanitizedTrainingAndImplementationCost = Math.max(0, trainingAndImplementationCost);
        const totalCost = sanitizedBaseCost + sanitizedTrainingAndImplementationCost;

        // Return 0 if calculation results in NaN or negative value
        return isNaN(totalCost) ? 0 : Math.max(0, totalCost);
    }

    useEffect(() => {
        form.setValue("total_cost", calculateTotalCost());
        // Recalculate payment terms when base_cost or training_and_implementation_cost changes
        const baseCost = form.getValues("base_cost");
        const trainingCost = form.getValues("training_and_implementation_cost") || 0;
        recalculatePaymentTerms(baseCost, trainingCost);
    }, [
        form.watch("base_cost"),
        form.watch("training_and_implementation_cost")
    ]);

    const getSignedUrl = async (file: File, field: keyof OrderDetailInputs) => {
        try {
            const filename = await uploadFile(file);
            form.setValue(field, filename as string)

            toast({
                variant: "success",
                title: "File Upload Successful",
                description: `The file ${file.name} has been uploaded successfully.`,
            })
        } catch (error) {
            console.log(error)
            toast({
                variant: "destructive",
                title: "File Upload Failed",
                description: `The file ${file.name} could not be uploaded. Please try again.`,
            });
        }
    }

    const renderFormField = (
        name: RenderFormFieldNameType,
        label: string | null,
        placeholder: string,
        type: string = "text",
        optional: boolean = false
    ) => {
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
            const value = parseFloat(e.target.value) || 0;
            const fieldName = name.toString();

            // Helper to determine which handler to use
            const getHandler = () => {
                if (fieldName.includes('base_cost_seperation')) return 'base_cost_seperation';
                if (fieldName.startsWith('amc_rate.')) return 'amc_rate';
                if (fieldName.includes('payment_terms')) return 'payment_terms';
                return fieldName;
            };

            // Handler mapping
            const handlers = {
                base_cost: () => {
                    field.onChange(e);
                    const trainingCost = Number(form.getValues("training_and_implementation_cost")) || 0;
                    recalculatePaymentTerms(value, trainingCost);
                    recalculateAMCRateBasedOnBaseCost(value);
                    reCalculateBaseSeperationCost(value);
                },
                training_and_implementation_cost: () => {
                    field.onChange(e);
                    const baseCost = Number(form.getValues("base_cost")) || 0;
                    recalculatePaymentTerms(baseCost, value);
                },
                base_cost_seperation: () => {
                    const [, index, term] = fieldName.split('.');
                    if (term === 'percentage') {
                        const calculatedAmount = (value * Number(form.getValues(`base_cost`))) / 100;
                        form.setValue(`base_cost_seperation.${parseInt(index)}.amount`, calculatedAmount);
                        field.onChange(e);
                    } else {
                        const baseCostValue = Number(form.getValues(`base_cost`)) || 1;
                        const percentage = ((value / baseCostValue) * 100).toFixed(2);
                        form.setValue(`base_cost_seperation.${parseInt(index)}.percentage`, Number(percentage));
                        field.onChange(e);
                    }
                },
                amc_rate: () => {
                    const amcType = fieldName.split('.')[1] as 'percentage' | 'amount';
                    recalculateAMCRate(value, amcType);
                },
                payment_terms: () => {
                    const [, index, term] = fieldName.split('.');
                    if (['percentage_from_base_cost', 'calculated_amount'].includes(term))
                        handlePaymentTermChange(parseInt(index), value, term as 'percentage_from_base_cost' | 'calculated_amount');
                    else
                        field.onChange(e);
                }
            };

            const handler = handlers[getHandler() as keyof typeof handlers];
            if (handler) {
                handler();
            } else {
                field.onChange(e);
            }
        };

        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: any) => {
            const file = e.target.files?.[0];
            if (file) {
                field.onChange(e);
                await getSignedUrl(file, name as keyof OrderDetailInputs);
            }
        };

        const renderFilePreview = (field: any) => (
            <div className="flex items-center gap-2">
                <Link href={field.value as string} target='_blank' passHref>
                    <Button variant={disableInput ? 'default' : 'outline'} type='button' className={!disableInput ? 'rounded-full w-8 h-8 ml-2 absolute -top-3 -right-10' : ''}>
                        {disableInput ? 'View' : <File className='w-1' />}
                    </Button>
                </Link>
                {
                    disableInput && (
                        <span className='text-sm text-gray-500'>{getFileNameFromUrl(field.value as string)}</span>
                    )
                }
            </div>
        )


        return (
            <FormField
                control={form.control}
                name={name}
                render={({ field }) => (
                    <FormItem className='w-full mb-4 md:mb-0'>
                        {label && (
                            <FormLabel className='text-gray-500 relative block w-fit'>
                                {label}
                                {
                                    optional && (
                                        <span className='text-xs text-gray-400 ml-1'>Optional</span>
                                    )
                                }
                                {(type === "file" && field.value && !disableInput) ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {renderFilePreview(field)}
                                            </TooltipTrigger>
                                            <TooltipContent>View File</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : null}
                            </FormLabel>
                        )}

                        {(type === "file" && field.value && disableInput) ? (
                            renderFilePreview(field)
                        ) : (
                            <FormControl>
                                <Input
                                    className='bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                    placeholder={placeholder}
                                    disabled={disableInput}
                                    type={type}
                                    {...field}
                                    value={(type === 'number' && field.value === 0) ? '' : (type === 'file' ? undefined : field.value as string)}
                                    onChange={(e) => type === 'file' ? handleFileChange(e, field) : handleInputChange(e, field)}
                                />
                            </FormControl>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    };

    const transformFormData = (data: OrderDetailInputs & LicenseDetails) => {
        // Check required fields
        if (!data.products || data.products.length === 0) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please select at least one product"
            });
            return;
        }

        if (!data.base_cost) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Base cost is required"
            });
            return;
        }

        // Check payment terms
        if (!data.payment_terms || !data.payment_terms.length) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "At least one payment term is required"
            });
            return;
        }

        const totalPercentage = data.payment_terms.reduce((sum: number, t: any) => sum + (Number(t.percentage_from_base_cost) || 0), 0);
        if (Math.round(totalPercentage) !== 100) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Payment terms must sum exactly to 100% of the base cost"
            });
            return;
        }

        // Validate payment terms data
        for (const term of data.payment_terms) {
            if (term.status === PAYMENT_STATUS_ENUM.PAID && !term.payment_receive_date) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "Payment receive date is required for paid payment terms"
                });
                return;
            }
            if (!term.name || !term.percentage_from_base_cost || !term.calculated_amount) {
                toast({
                    variant: "destructive",
                    title: "Validation Error",
                    description: "All payment term fields are required"
                });
                return;
            }
            // Clear payment receive date if status is pending
            if (term.status === PAYMENT_STATUS_ENUM.PENDING && term.payment_receive_date) {
                term.payment_receive_date = undefined;
            }
        }

        // Transform the data
        const transformedData = {
            ...data,
            base_cost: Number(data.base_cost) || 0,
            amc_rate: {
                percentage: Number(data.amc_rate?.percentage) || 0,
                amount: Number(data.amc_rate?.amount) || 0
            },
            payment_terms: data.payment_terms.map((term: IPaymentTerm) => ({
                ...term,
                percentage_from_base_cost: Number(term.percentage_from_base_cost) || 0,
                calculated_amount: Number(term.calculated_amount) || 0,
                invoice_date: term.invoice_date ? new Date(term.invoice_date) : undefined,
                payment_receive_date: term.payment_receive_date ? new Date(term.payment_receive_date) : undefined
            })),
            agreements: data.agreements.map((date: any) => ({
                start: date.start ? new Date(date.start) : new Date(),
                end: date.end ? new Date(date.end) : new Date(),
                document: date.document || ""
            })),
            amc_start_date: data.amc_start_date ? new Date(data.amc_start_date) : undefined,
            training_and_implementation_cost: Number(data.training_and_implementation_cost) || 0,
            cost_per_license: Number(data.cost_per_license) || 0,
            licenses_with_base_price: Number(data.licenses_with_base_price) || 0,
            amc_rate_change_frequency_in_years: Number(data.amc_rate_change_frequency_in_years) || 0,
            amc_start_logs: (data.amc_start_logs || []).map((log: any) => ({
                ...log,
                from: log.from ? new Date(log.from) : undefined,
                to: log.to ? new Date(log.to) : undefined,
                date: log.date ? new Date(log.date) : new Date(),
                user: log.user || user?._id || ''
            }))
        };

        return transformedData;
    };

    const hasAmcStartDateChanged = () => {
        const currentStartDate = form.getValues("amc_start_date");

        if (!initialAmcStartDate && !currentStartDate) return false;
        if (!initialAmcStartDate && currentStartDate) return true;
        if (initialAmcStartDate && !currentStartDate) return true;

        return (
            new Date(initialAmcStartDate as Date).getTime() !==
            new Date(currentStartDate as Date).getTime()
        );
    };

    const hasAmcRateChanged = () => {
        if (!initialAmcRate) return false;
        const currentAmcRate = form.getValues("amc_rate");
        return initialAmcRate.percentage !== currentAmcRate.percentage ||
            initialAmcRate.amount !== currentAmcRate.amount;
    };

    const hasStatusChanged = () => {
        if (!initialStatus) return false;
        const currentStatus = form.getValues("status");
        return initialStatus !== currentStatus;
    };

    const onSubmit: SubmitHandler<OrderDetailInputs & LicenseDetails> = async (data) => {
        if (defaultValue?._id) {
            if (hasAmcStartDateChanged()) {
                const currentDate = new Date();
                setAmcStartChangeDate(currentDate);
                amcStartChangeForm.setValue("change_date", currentDate);
                setShowAmcStartChangeModal(true);
                return;
            }
            if (hasAmcRateChanged()) {
                setShowAmcHistoryModal(true);
                return;
            }
            if (hasStatusChanged()) {
                setShowStatusChangeModal(true);
                return;
            }
        }

        const transformedData = transformFormData(data);
        if (!transformedData) return;

        try {
            if (defaultValue?._id && updateHandler) {
                updateHandler({ ...transformedData }).then(() => {
                    toast({
                        variant: "success",
                        title: "Order Updated",
                    })
                })
            } else {
                handler({ ...transformedData }).then(() => {
                    toast({
                        variant: "success",
                        title: "Order Created",
                    })
                })
            }
            setDisableInput(true)
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occured while updating the order",
                description: error?.message || `Please try again and if error still persist contact the developer`
            })
        }
    }

    const handleAmcStartChangeSubmit = async () => {
        const data = form.getValues();

        const updatedLogs = [
            ...(data.amc_start_logs || []),
            {
                from: initialAmcStartDate || data.amc_start_date,
                to: data.amc_start_date,
                date: amcStartChangeDate,
                user: user?._id || ''
            }
        ];

        form.setValue("amc_start_logs", updatedLogs, { shouldDirty: true });

        const transformedData = transformFormData({
            ...data,
            amc_start_logs: updatedLogs
        });

        if (!transformedData) return;

        try {
            if (defaultValue?._id && updateHandler) {
                await updateHandler({ ...transformedData });
                toast({
                    variant: "success",
                    title: "Order Updated",
                });
                form.setValue("amc_start_logs", updatedLogs, { shouldDirty: false });
                setShowAmcStartChangeModal(false);
                setDisableInput(true);
                setInitialAmcStartDate(data.amc_start_date || null);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occurred while updating the order",
                description: error?.message || `Please try again and if error still persists contact the developer`
            });
        }
    };

    const handleAmcHistorySubmit = async () => {
        const data = form.getValues();

        // Store the old AMC rate in history
        const transformedData = transformFormData({
            ...data,
            amc_rate_history: [
                ...(data.amc_rate_history || []),
                {
                    percentage: initialAmcRate?.percentage || 0,
                    amount: initialAmcRate?.amount || 0,
                    date: amcHistoryDate
                }
            ]
        });

        if (!transformedData) return;

        try {
            if (defaultValue?._id && updateHandler) {
                await updateHandler({ ...transformedData });
                toast({
                    variant: "success",
                    title: "Order Updated",
                });
                setShowAmcHistoryModal(false);
                setDisableInput(true);
                // Update the initialAmcRate to the new value for future changes
                setInitialAmcRate(data.amc_rate);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occurred while updating the order",
                description: error?.message || `Please try again and if error still persists contact the developer`
            });
        }
    };

    const handleStatusChangeSubmit = async () => {
        const data = form.getValues();

        // Store the old status in status_logs
        const transformedData = transformFormData({
            ...data,
            status_logs: [
                ...(data.status_logs || []),
                {
                    from: initialStatus as ORDER_STATUS_ENUM,
                    to: data.status as ORDER_STATUS_ENUM,
                    date: statusChangeDate,
                    user: user?._id || ''
                }
            ]
        });

        if (!transformedData) return;

        try {
            if (defaultValue?._id && updateHandler) {
                await updateHandler({ ...transformedData });
                toast({
                    variant: "success",
                    title: "Order Updated",
                });
                setShowStatusChangeModal(false);
                setDisableInput(true);
                // Update the initialStatus to the new value for future changes
                setInitialStatus(data.status as ORDER_STATUS_ENUM);
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error Occurred while updating the order",
                description: error?.message || `Please try again and if error still persists contact the developer`
            });
        }
    };

    const AmcStartChangeModal = () => (
        <Dialog open={showAmcStartChangeModal} onOpenChange={(val) => !val && setShowAmcStartChangeModal(false)}>
            <DialogContent>
                <DialogTitle>AMC Start Date Change</DialogTitle>
                <DialogDescription>
                    Please specify when the AMC start date changed from {initialAmcStartDate ? new Date(initialAmcStartDate).toLocaleDateString() : "N/A"} to {form.getValues("amc_start_date") ? new Date(form.getValues("amc_start_date") as Date).toLocaleDateString() : "N/A"}.
                </DialogDescription>
                <Form {...amcStartChangeForm}>
                    <form onSubmit={amcStartChangeForm.handleSubmit(() => handleAmcStartChangeSubmit())}>
                        <div className="mt-4">
                            <FormField
                                control={amcStartChangeForm.control}
                                name="change_date"
                                render={({ field }) => (
                                    <FormItem className='w-full'>
                                        <FormLabel className="text-gray-500">Change Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                onDateChange={(date: Date | undefined) => {
                                                    if (date) {
                                                        setAmcStartChangeDate(date);
                                                        field.onChange(date);
                                                    }
                                                }}
                                                placeholder='Select date of change'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="mt-4">
                                <Typography variant="h4" className="mb-2">AMC Start Date Change Details:</Typography>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Previous Start Date:</span>
                                        <p>{initialAmcStartDate ? new Date(initialAmcStartDate).toLocaleDateString() : "N/A"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">New Start Date:</span>
                                        <p>{form.getValues("amc_start_date") ? new Date(form.getValues("amc_start_date") as Date).toLocaleDateString() : "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowAmcStartChangeModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );

    const AmcHistoryModal = () => (
        <Dialog open={showAmcHistoryModal} onOpenChange={(val) => !val && setShowAmcHistoryModal(false)}>
            <DialogContent>
                <DialogTitle>AMC Rate Change History</DialogTitle>
                <DialogDescription>
                    Please specify when this AMC rate was changed from {initialAmcRate?.percentage}% to {form.getValues("amc_rate.percentage")}%
                </DialogDescription>
                <Form {...amcHistoryForm}>
                    <form onSubmit={amcHistoryForm.handleSubmit(() => handleAmcHistorySubmit())}>
                        <div className="mt-4">
                            <FormField
                                control={amcHistoryForm.control}
                                name="change_date"
                                render={({ field }) => (
                                    <FormItem className='w-full'>
                                        <FormLabel className="text-gray-500">Change Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                onDateChange={(date: Date | undefined) => {
                                                    if (date) {
                                                        setAmcHistoryDate(date);
                                                        field.onChange(date);
                                                    }
                                                }}
                                                placeholder='Select date of change'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="mt-4">
                                <Typography variant="h4" className="mb-2">AMC Rate Change Details:</Typography>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Old Rate:</span>
                                        <p>Percentage: {initialAmcRate?.percentage}%</p>
                                        <p>Amount: {formatCurrency(initialAmcRate?.amount || 0)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">New Rate:</span>
                                        <p>Percentage: {form.getValues("amc_rate.percentage")}%</p>
                                        <p>Amount: {formatCurrency(form.getValues("amc_rate.amount"))}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowAmcHistoryModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );

    const StatusChangeModal = () => (
        <Dialog open={showStatusChangeModal} onOpenChange={(val) => !val && setShowStatusChangeModal(false)}>
            <DialogContent>
                <DialogTitle>Status Change History</DialogTitle>
                <DialogDescription>
                    Please specify when the status was changed from {initialStatus} to {form.getValues("status")}
                </DialogDescription>
                <Form {...statusChangeForm}>
                    <form onSubmit={statusChangeForm.handleSubmit(() => handleStatusChangeSubmit())}>
                        <div className="mt-4">
                            <FormField
                                control={statusChangeForm.control}
                                name="change_date"
                                render={({ field }) => (
                                    <FormItem className='w-full'>
                                        <FormLabel className="text-gray-500">Change Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                onDateChange={(date: Date | undefined) => {
                                                    if (date) {
                                                        setStatusChangeDate(date);
                                                        field.onChange(date);
                                                    }
                                                }}
                                                placeholder='Select date of change'
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="mt-4">
                                <Typography variant="h4" className="mb-2">Status Change Details:</Typography>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Old Status:</span>
                                        <div className='flex justify-start items-center gap-2'>
                                            <span className={`bg-${initialStatus === ORDER_STATUS_ENUM.ACTIVE ? 'green' : 'red'}-500 w-2.5 h-2.5 rounded-full`}></span>
                                            <span>{initialStatus}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">New Status:</span>
                                        <div className='flex justify-start items-center gap-2'>
                                            <span className={`bg-${form.getValues("status") === ORDER_STATUS_ENUM.ACTIVE ? 'green' : 'red'}-500 w-2.5 h-2.5 rounded-full`}></span>
                                            <span>{form.getValues("status")}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowStatusChangeModal(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );

    const StatusLogsModal = () => (
        <Dialog open={showStatusLogsModal} onOpenChange={(val) => !val && setShowStatusLogsModal(false)}>
            <DialogContent>
                <DialogTitle>Status Change History</DialogTitle>
                <DialogDescription>
                    History of all status changes for this order
                </DialogDescription>
                <div className="mt-4 space-y-4">
                    {(form.watch("status_logs") || []).map((log, index) => (
                        <Card key={index}>
                            <CardContent className="p-4">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">From:</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${log.from === ORDER_STATUS_ENUM.ACTIVE ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <span className="capitalize">{log.from}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">To:</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${log.to === ORDER_STATUS_ENUM.ACTIVE ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                <span className="capitalize">{log.to}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Changed on: {new Date(log.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => setShowStatusLogsModal(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const AmcStartLogsModal = () => (
        <Dialog open={showAmcStartLogsModal} onOpenChange={(val) => !val && setShowAmcStartLogsModal(false)}>
            <DialogContent>
                <DialogTitle>AMC Start Date History</DialogTitle>
                <DialogDescription>
                    History of all AMC start date changes for this order
                </DialogDescription>
                <div className="mt-4 space-y-4">
                    {(amcStartLogs || []).map((log: any, index: number) => (
                        <Card key={index}>
                            <CardContent className="p-4">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">From:</span>
                                            <span>{log.from ? new Date(log.from).toLocaleDateString() : "N/A"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">To:</span>
                                            <span>{log.to ? new Date(log.to).toLocaleDateString() : "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Changed on: {log.date ? new Date(log.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : "N/A"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {(!amcStartLogs || amcStartLogs.length === 0) && (
                        <Typography variant="p" className="text-sm text-gray-500">
                            No start date changes recorded yet.
                        </Typography>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => setShowAmcStartLogsModal(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const AmcRateHistoryModal = () => (
        <Dialog open={showAmcRateHistoryModal} onOpenChange={(val) => !val && setShowAmcRateHistoryModal(false)}>
            <DialogContent className="max-w-4xl">
                <DialogTitle>AMC Rate History</DialogTitle>
                <DialogDescription>
                    History of all AMC rate changes for this order
                </DialogDescription>
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Percentage</TableHead>
                                <TableHead>Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(defaultValue?.amc_rate_history || []).map((history, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {new Date(history.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </TableCell>
                                    <TableCell>{history.percentage}%</TableCell>
                                    <TableCell>{formatCurrency(history.amount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => setShowAmcRateHistoryModal(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const getSelectedProducts = useCallback(() => {
        const selectedProducts = form.watch("products") || [];
        return products.filter(product => selectedProducts.includes(product._id))
    }, [form, products]);

    const getProductById = (id: string) => products.find(product => product._id === id);

    const onProductSelectHandler = (selectedProducts: IProduct[]) => {
        // Clear existing base cost separation
        const currentFields = form.getValues("base_cost_seperation") || [];

        // Create a map of existing product IDs for quick lookup
        const existingProductIds = new Set(currentFields.map(field => field.product_id));

        // Add only new selected products
        selectedProducts.forEach(product => {
            if (!existingProductIds.has(product?._id)) {
                appendBaseCostSeperation({
                    product_id: product._id,
                    amount: 0,
                    percentage: 0
                });
            }
        });

        // Remove products that are no longer selected
        const selectedProductIds = new Set(selectedProducts.map(p => p._id));
        currentFields.forEach((field, index) => {
            if (!selectedProductIds.has(field.product_id)) {
                removebaseCostSeparation(index);
            }
        });

        // if license is selected then add the license details
        if (selectedProducts.some(product => product.does_have_license)) {
            form.setValue("licenses_with_base_price", selectedProducts.find(product => product.does_have_license)?.default_number_of_licenses || 0)
        }
    }

    if (!products) return null

    const onOtherDocumentChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const otherDocuments: { title: string, url: string }[] = []
        for (const file of files) {
            const filename = await uploadFile(file, false);
            if (!filename) continue;
            otherDocuments.push({ title: file.name, url: filename })
        }
        toast({
            variant: "success",
            title: "File Upload Successful",
            description: `The files has been uploaded successfully.`,
        })
        form.setValue("other_documents", otherDocuments)
    }

    const handleDeleteOrder = async () => {
        if (!defaultValue?._id) return;
        
        try {
            await deleteOrderById(defaultValue._id).unwrap();
            toast({
                variant: "success",
                title: "Order Deleted",
                description: "The order has been deleted successfully"
            });
            setShowDeleteConfirmation(false);
            // Navigate to previous page or dashboard
            router.back();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "An error occurred while deleting the order"
            });
        }
    };

    const DeleteConfirmationDialog = () => (
        <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-destructive">Delete Order</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this order? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex items-center justify-end space-x-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirmation(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteOrder}
                        loading={{ isLoading: isDeleting, loader: "tailspin" }}
                    >
                        Yes, Delete Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const finalJSX = (
        <div className="mt-1 p-2">
            {defaultValue?._id && (
                <div className="mb-2 flex justify-end gap-3">
                    <Link href={`/amc/${defaultValue?._id}`} passHref target="_blank">
                        <Button type='button' variant='default' className='w-36 justify-between'>
                            <Wrench />
                            <span>Show AMC</span>
                        </Button>
                    </Link>
                    <Button type='button' className={`w-36 justify-between ${!disableInput ? "bg-destructive hover:bg-destructive" : ""}`} onClick={() => setDisableInput(prev => !prev)}>
                        {disableInput ? (
                            <>
                                <Edit />
                                <span>Start Editing</span>
                            </>
                        ) : (
                            <>
                                <CircleX />
                                <span>Close Editing</span>
                            </>
                        )}
                    </Button>
                    <Button
                        type='button'
                        variant='destructive'
                        className='w-36 justify-between'
                        onClick={() => setShowDeleteConfirmation(true)}
                    >
                        <Trash2 />
                        <span>Delete Order</span>
                    </Button>
                </div>
            )}
            <Form {...form}>
                <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardContent className='p-6'>
                            <div className="md:flex items-end gap-4 w-full">
                                <FormField
                                    control={form.control}
                                    name="products"
                                    render={({ field }) => (
                                        <FormItem className='w-full relative mb-4 md:mb-0'>
                                            <FormLabel className='text-gray-500'>Select Products</FormLabel>
                                            <FormControl>
                                                <ProductDropdown
                                                    values={defaultValue?.products || []}
                                                    isMultiSelect
                                                    disabled={disableInput}
                                                    onSelectionChange={(selectedProducts) => {
                                                        onProductSelectHandler(selectedProducts)
                                                        field.onChange(selectedProducts.map(product => product._id));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {renderFormField("base_cost", "Base Cost", "Base Cost of the Product", "number")}
                            </div>

                            {
                                (form.watch("products").length > 1 && baseCostSeparationFields.length > 0) && (
                                    <div className="mt-4">
                                        <Typography variant='h3'>Base Cost Seperation</Typography>

                                        <div className="mt-2 ">
                                            {baseCostSeparationFields.map((baseCostSeperation, index) => {
                                                const product = getProductById(baseCostSeperation.product_id);
                                                return (
                                                    <div key={index} className="md:flex items-center relative gap-4 w-full mb-7 md:mb-4">
                                                        <FormItem className='w-full'>
                                                            <FormLabel className='text-gray-500'>Product</FormLabel>
                                                            <Input type="text" value={product?.name || ""} disabled />
                                                        </FormItem>
                                                        {renderFormField(`base_cost_seperation.${index}.percentage`, "Percentage", "Percentage from Base Cost", "number")}
                                                        {renderFormField(`base_cost_seperation.${index}.amount`, "Amount", "Amount(Auto Calculated)", "number")}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            }
                            <Separator className='bg-gray-300 w-full h-[1px] mt-4' />

                            <div className="md:flex items-start gap-4 w-full mt-4">
                                <FormField
                                    control={form.control}
                                    name="amc_rate"
                                    render={({ field }) => (
                                        <FormItem className='w-full relative mb-4 md:mb-0'>
                                            <FormLabel className='text-gray-500 flex items-center gap-2'>
                                                AMC Rate ({formatCurrency(form.watch("amc_rate.amount"))})
                                                {defaultValue?.amc_rate_history && defaultValue?.amc_rate_history?.length > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                        onClick={() => setShowAmcRateHistoryModal(true)}
                                                    >
                                                        <Clock className="w-3 h-3" />
                                                        History
                                                    </Button>
                                                )}
                                            </FormLabel>
                                            <FormControl>
                                                <AmountInput
                                                    className='bg-white'
                                                    placeholder='AMC Rate'
                                                    disabled={disableInput}
                                                    defaultInputValue={{
                                                        percentage: field.value.percentage,
                                                        value: field.value.amount
                                                    }}
                                                    onModeChange={(isPercentage) => setIsPercentage(prev => ({ ...prev, amc_rate: isPercentage }))}
                                                    onValueChange={(value: number | null) => {
                                                        if (!value) return;
                                                        const baseCost = form.getValues("base_cost");
                                                        if (isPercentage.amc_rate) {
                                                            const percentage = parseFloat(value.toString()) || 0;
                                                            const calculatedAmount = (baseCost * percentage) / 100;
                                                            field.onChange({

                                                                percentage: percentage,
                                                                amount: calculatedAmount.toString()
                                                            });
                                                            setIsPercentage({ ...isPercentage, amc_rate: true })
                                                        } else {
                                                            const amount = parseFloat(value.toString()) || 0;
                                                            const calculatedPercentage = (amount / baseCost) * 100;
                                                            field.onChange({
                                                                percentage: calculatedPercentage,
                                                                amount: value
                                                            });
                                                            setIsPercentage({ ...isPercentage, amc_rate: false })
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {renderFormField("amc_rate_change_frequency_in_years", "AMC Rate Change Frequency (Years)", "Enter frequency in years", "number")}
                            </div>
                            <div className="md:flex items-start gap-4 w-full mt-4">
                                {renderFormField("training_and_implementation_cost", "Training and Implementation Cost", "Training and Implementation Cost", "number")}

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className='w-full relative'>
                                            <FormLabel className='text-gray-500 flex items-center gap-3'>Order Status
                                                {defaultValue?.status_logs && defaultValue?.status_logs?.length > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className="mt-2 flex items-center gap-2"
                                                        onClick={() => setShowStatusLogsModal(true)}
                                                    >
                                                        <History className="w-4 h-4" />
                                                        View Status History
                                                    </Button>
                                                )}</FormLabel>
                                            <FormControl>
                                                <Select defaultValue={ORDER_STATUS_ENUM.ACTIVE} onValueChange={field.onChange} disabled={disableInput}>
                                                    <SelectTrigger className="w-full bg-white">
                                                        <SelectValue>{
                                                            form.watch("status") === ORDER_STATUS_ENUM.ACTIVE ?
                                                                <div className='flex justify-start items-center gap-2'>
                                                                    <span className="bg-green-500 w-2.5 h-2.5 rounded-full"></span>
                                                                    <span>Active</span>
                                                                </div> :
                                                                <div className='flex justify-start items-center gap-2'>
                                                                    <span className="bg-red-500 w-2.5 h-2.5 rounded-full"></span>
                                                                    <span>Inactive</span>
                                                                </div>
                                                        }</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className="w-full">
                                                        {StatusOptions.map((status) => (
                                                            <SelectItem key={status.value} value={status.value}>
                                                                {status.label()}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                            </div>
                            <div className="flex items-start gap-4 w-full mt-4">
                                <FormField
                                    control={form.control}
                                    name="purchased_date"
                                    render={({ field }) => (
                                        <FormItem className='w-full relative'>
                                            <FormLabel className='text-gray-500'>Order Purchased Date</FormLabel>
                                            <FormControl>
                                                <DatePicker date={field.value} onDateChange={field.onChange} disabled={disableInput} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    {getSelectedProducts().some(product => product.does_have_license) && (
                        <Card>
                            <CardContent className='p-6'>
                                <div className="">
                                    <div className="flex justify-between items-center">
                                        <Typography variant='h3'>Licenses</Typography>
                                    </div>
                                    <div className="flex items-end md:flex-nowrap flex-wrap gap-4 w-full mt-2">
                                        {renderFormField("licenses_with_base_price", "Auditor Licenses with Base Price", "Total number of Licenses ", "number")}
                                        {renderFormField("cost_per_license", "Additional Cost Per Licencse", "Additional Cost Per Licencse", "number")}
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    )}
                    <div className="mt-6">
                        <div className="">
                            <Card>
                                <CardContent className='p-6'>
                                    <Typography variant='h3' className="mb-6">Payment Terms</Typography>
                                    {paymentTermsFields.map((paymentTerm, index) => (
                                        <Card key={paymentTerm.id} className="mb-6 last:mb-0 relative">
                                            <CardContent className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 items-end">
                                                    {renderFormField(`payment_terms.${index}.name`, "Name", "Name of the Payment Term")}
                                                    {renderFormField(`payment_terms.${index}.percentage_from_base_cost`, "Percentage from Base Cost + T&I Cost", "Percentage", "number")}
                                                    {renderFormField(`payment_terms.${index}.calculated_amount`, "Amount (Auto Calculated)", "Amount", "number")}
                                                    {renderFormField(`payment_terms.${index}.invoice_number`, "Invoice Number", "Invoice Number")}
                                                    <FormField
                                                        control={form.control}
                                                        name={`payment_terms.${index}.invoice_date`}
                                                        render={({ field }) => (
                                                            <FormItem className='w-full'>
                                                                <FormLabel className="text-gray-500">Invoice Date</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <DatePicker date={field.value} onDateChange={field.onChange} placeholder='Date' disabled={disableInput} />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    {renderFormField(`payment_terms.${index}.invoice_document`, "Invoice Document", "Upload Invoice Document", "file")}
                                                    <FormField
                                                        control={form.control}
                                                        name={`payment_terms.${index}.status`}
                                                        render={({ field }) => (
                                                            <FormItem className='w-full mb-4 md:mb-0'>
                                                                <FormLabel className="text-gray-500">Payment Status</FormLabel>
                                                                <FormControl>
                                                                    <Select onValueChange={field.onChange}>
                                                                        <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                                            <SelectValue className="capitalize" placeholder=
                                                                                {
                                                                                    field.value === PAYMENT_STATUS_ENUM.PAID ? (
                                                                                        <div className="flex items-center">
                                                                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                                                            {PAYMENT_STATUS_ENUM.PAID}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex items-center">
                                                                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                                                                            <span className="capitalize">{PAYMENT_STATUS_ENUM.PENDING}</span>
                                                                                        </div>
                                                                                    )
                                                                                }
                                                                            >

                                                                            </SelectValue>
                                                                        </SelectTrigger>
                                                                        <SelectContent className='bg-white'>
                                                                            {
                                                                                Object.entries(PAYMENT_STATUS_ENUM)
                                                                                    .filter(([key]) => isNaN(Number(key)))
                                                                                    .map(([key, value]) => (
                                                                                        <SelectItem value={value} key={key} className='capitalize'>
                                                                                            {value === PAYMENT_STATUS_ENUM.PAID ? (
                                                                                                <div className="flex items-center">
                                                                                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                                                                                    {value}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <div className="flex items-center">
                                                                                                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                                                                                    <span className="capitalize">{value}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </SelectItem>
                                                                                    ))
                                                                            }
                                                                        </SelectContent>
                                                                    </Select>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`payment_terms.${index}.payment_receive_date`}
                                                        render={({ field }) => (
                                                            <FormItem className='w-full'>
                                                                <FormLabel className="text-gray-500">Payment Receive Date</FormLabel>
                                                                <FormControl>
                                                                    <div className="relative">
                                                                        <DatePicker date={field.value} onDateChange={field.onChange} placeholder='Payment Receive Date' disabled={disableInput} />
                                                                    </div>
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                </div>
                                                <div className="flex items-center justify-between mt-4 absolute -top-6 -right-3">
                                                    <Button type='button' variant='destructive' onClick={() => removePaymentTerm(index)} className='flex-shrink-0 w-8 h-8 rounded-full' disabled={disableInput}>
                                                        <X size={16} />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    <div className="flex justify-center mt-6">
                                        <Button
                                            type='button'
                                            disabled={disableInput}
                                            onClick={addPaymentTerm}
                                            className="flex items-center justify-center gap-2 py-5 px-6 bg-[#E6E6E6] text-black hover:bg-black hover:text-white transition-colors duration-200"
                                        >
                                            <CirclePlus className='w-5 h-5' />
                                            <span>Add more terms</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                            <div className="flex flex-col md:flex-row gap-4 w-full mt-4">
                                <Card className="flex-1 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold text-gray-700">Total Cost</h3>
                                            <IndianRupee className="w-6 h-6 text-green-500" />
                                        </div>
                                        <p className="text-3xl font-bold text-gray-800">
                                            {formatCurrency(calculateTotalCost())}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="flex-1 transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold text-gray-700">AMC Amount</h3>
                                            <Wrench className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <p className="text-3xl font-bold text-gray-800">
                                            {formatCurrency(defaultValue?.amc_amount || form.watch("amc_rate.amount"))}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                        </div>
                        <Card className='mt-4'>
                            <CardContent className='p-6'>
                                <div className="md:flex items-end gap-4 w-full mt-6">
                                    {renderFormField("purchase_order_number", "PO Number", "", "text", true)}
                                    {renderFormField("purchase_order_document", "PO Document", "", "file", true)}
                                </div>
                                <div className="md:flex items-end gap-4 w-full mt-6">
                                    <FormField
                                        control={form.control}
                                        name={`amc_start_date`}
                                        render={({ field }) => (
                                            <FormItem className='w-full relative mb-4 md:mb-0'>
                                                <FormLabel className='text-gray-500 flex items-center gap-2'>
                                                    AMC Start Date
                                                    {(amcStartLogs && amcStartLogs.length > 0) && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex items-center gap-1"
                                                            onClick={() => setShowAmcStartLogsModal(true)}
                                                        >
                                                            <History className="w-3 h-3" />
                                                            History
                                                        </Button>
                                                    )}
                                                </FormLabel>
                                                <FormControl>
                                                    <DatePicker date={field.value} onDateChange={field.onChange} placeholder='Pick a Date' disabled={disableInput} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* Add a Form Field for other documents which accepts multiple files */}
                                    <FormField
                                        control={form.control}
                                        name="other_documents"
                                        render={({ field }) => (
                                            <FormItem className='w-full relative mb-4 md:mb-0'>
                                                <div className="flex items-center gap-2">
                                                    <FormLabel className='text-gray-500'>Other Documents</FormLabel>
                                                    {
                                                        field.value?.length ? (
                                                            <ShowMultipleFilesModal files={field.value.length ? field.value.map(file => file.url) : []} getFileNameFromUrl={getFileNameFromUrl} />
                                                        ) : null
                                                    }
                                                </div>
                                                <FormControl>
                                                    <Input type="file" multiple onChange={onOtherDocumentChange} disabled={disableInput} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className=" mt-6">
                                    <Typography variant='h3' className='mb-3'>Agreement <span className='text-xs text-gray-400 ml-1'>Optional</span> </Typography>
                                    {
                                        agreementsData.map((_, index: number) => (
                                            <div className="md:flex items-end mb-4 justify-between gap-4 w-full" key={index}>
                                                <FormField
                                                    control={form.control}
                                                    name={`agreements.${index}.start`}
                                                    render={({ field }) => (
                                                        <FormItem className='w-full relative'>
                                                            <FormLabel className='text-gray-500'>Agreement Start Date</FormLabel>
                                                            <FormControl>
                                                                <DatePicker date={field.value} onDateChange={field.onChange} placeholder='Pick a Date' disabled={disableInput} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`agreements.${index}.end`}
                                                    render={({ field }) => (
                                                        <FormItem className='w-full relative'>
                                                            <FormLabel className='text-gray-500'>Agreement End Date</FormLabel>
                                                            <FormControl>
                                                                <DatePicker date={field.value} onDateChange={field.onChange} placeholder='Pick a Date' disabled={disableInput} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {renderFormField(`agreements.${index}.document`, "Agreement Document", "", "file")}
                                                <Button type="button" variant='destructive' onClick={() => removeAgreementDateField(index)} className='w-full mt-2 md:mt-2 md:rounded-full md:w-8 md:h-8 ' disabled={disableInput}>
                                                    <X />
                                                    <span className='md:hidden block'>Delete</span>
                                                </Button>
                                            </div>
                                        ))
                                    }
                                    <div className="flex justify-center mt-4">
                                        <Button
                                            type='button'
                                            disabled={disableInput}
                                            onClick={() => {
                                                appendAgreementDateFields({
                                                    start: new Date(),
                                                    end: new Date(),
                                                    document: ""
                                                })
                                            }}
                                            className="flex items-center justify-center gap-2 py-5 md:w-72 bg-[#E6E6E6] text-black hover:bg-black hover:text-white group"
                                        >
                                            <CirclePlus className='!w-6 !h-6' />
                                            <Typography variant='p' className='text-black group-hover:text-white'>Add more terms</Typography>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={disableInput || isLoading || !form.formState.isValid} loading={{ isLoading, loader: "tailspin" }} className='w-full py-5 md:py-2 md:w-36'>
                            <CircleCheck />
                            <span className='text-white'>Save changes</span>
                        </Button>
                    </div>
                </form>

            </Form>
            {DeleteConfirmationDialog()}
        </div>
    )

    const renderContent = () => {
        if (removeAccordion) {
            return finalJSX;
        }

        return (
            <Accordion type="single" collapsible defaultValue={defaultOpen ? "client-detail" : undefined}>
                <AccordionItem value="client-detail">
                    <AccordionTrigger>
                        <Typography variant='h1'>{title ?? "Order Details"}</Typography>
                    </AccordionTrigger>
                    <AccordionContent>
                        {AmcStartChangeModal()}
                        {AmcStartLogsModal()}
                        {AmcHistoryModal()}
                        {StatusChangeModal()}
                        {StatusLogsModal()}
                        {AmcRateHistoryModal()}
                        {finalJSX}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        );
    };

    return (
        <div className='bg-custom-gray bg-opacity-75 rounded p-4'>
            {renderContent()}
        </div>
    )
}

export default memo(OrderDetail)