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
import { CircleCheck, CirclePlus, CircleX, Edit, File, IndianRupee, Wrench, X } from 'lucide-react'
import { Separator } from '@radix-ui/react-separator'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { CustomizationType, IPaymentTerm, LicenseDetails, OrderDetailInputs } from '@/types/order'
import { useAppSelector } from '@/redux/hook'
import { IOrderObject, PAYMENT_STATUS_ENUM } from '@/redux/api/order'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link'
import { IProduct } from '@/types/product'
import { ModuleData, ModulesCombobox } from '@/components/Purchase/Form/CustomizationForm'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { useUpdateProductByIdMutation } from '@/redux/api/product'
import { Card, CardContent } from '@/components/ui/card'
import { useFileUpload } from '@/hooks/useFileUpload'
import { formatCurrency } from '@/lib/utils'
import ShowMultipleFilesModal from '@/components/common/ShowMultipleFiles'

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
    | 'customization.cost' | `customization.modules.${number}` | `other_documents.${number}.url` | `other_documents.${number}.title`


const OrderDetail: React.FC<OrderProps> = ({ title, handler, defaultValue, updateHandler, removeAccordion, defaultOpen = false, isLoading = false }) => {
    const [disableInput, setDisableInput] = useState(false);
    const [isPercentage, setIsPercentage] = useState({ amc_rate: true, customization_amc_rate: true })
    const [enableCustomization, setEnableCustomization] = useState(true)
    const [addNewModule, setAddNewModule] = useState<{ add: boolean, value: string, type?: "report" | "module", description: string, product?: string }>({ add: false, value: '', type: 'module', description: '' })

    const { uploadFile, getFileNameFromUrl } = useFileUpload()

    const { toast } = useToast()
    const { products } = useAppSelector(state => state.user)

    useEffect(() => {
        if (defaultValue?._id) {
            setDisableInput(true)

            setEnableCustomization(!!defaultValue?.is_purchased_with_order?.customization)
        }
    }, [defaultValue])

    const defaultValues = {
        products: [],
        base_cost: 0,
        amc_rate: {
            percentage: 20,
            amount: 0,
        },
        status: ORDER_STATUS_ENUM.ACTIVE,
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
        invoice_document: "",
        total_license: 0,
        licenses_with_base_price: 0,
        customization: {
            cost: 0,
            amc_rate: {
                percentage: 0,
                amount: 0
            },
            modules: [],
            type: "module" as CustomizationType,
            reports: []
        },
        purchased_date: new Date(),
        base_cost_seperation: [],
    }

    const values = useMemo(() => defaultValue ? {
        products: defaultValue.products || [],
        base_cost: defaultValue.base_cost,
        amc_rate: defaultValue.amc_rate,
        status: defaultValue.status as ORDER_STATUS_ENUM,
        payment_terms: defaultValue.payment_terms.map(term => ({ ...term, invoice_date: term.invoice_date ? new Date(term.invoice_date) : undefined, payment_receive_date: term.payment_receive_date ? new Date(term.payment_receive_date) : undefined })),
        agreements: defaultValue.agreements,
        cost_per_license: defaultValue.cost_per_license || 0,
        licenses_with_base_price: defaultValue.licenses_with_base_price || 0,
        customization: {
            cost: defaultValue?.customization?.cost || 0,
            modules: defaultValue?.customization?.modules || [],
            reports: defaultValue?.customization?.reports || [],
            type: defaultValue?.customization?.type || ("module" as CustomizationType),
        },
        amc_start_date: new Date(defaultValue.amc_start_date),
        other_documents: defaultValue?.other_documents || [],
        purchase_order_document: defaultValue.purchase_order_document || "",
        purchased_date: new Date(defaultValue.purchased_date || new Date()),
        base_cost_seperation: defaultValue.base_cost_seperation || []
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

    const { fields: agreementDateFields, append: appendAgreementDateFields, remove: removeAgreementDateField } = useFieldArray({
        control: form.control,
        name: "agreements"
    })

    // Create useFieldArray for customization modules
    const customizationModulesFields = form.watch("customization.modules") || []
    const reportFields = form.watch("customization.reports") || []
    const appendCustomizationModule = (value: string, type: "module" | "report" = "module") => {
        if (type === "module") form.setValue("customization.modules", [...customizationModulesFields, value])
        else form.setValue("customization.reports", [...(reportFields || []), value])
    }

    const [updateProductByIdApi] = useUpdateProductByIdMutation()

    const removeCustomizationModule = (index: number, type: "module" | "report" = "module") => {
        if (type === "module")
            form.setValue("customization.modules", customizationModulesFields.filter((_, i) => i !== index))
        else
            form.setValue("customization.reports", (reportFields || []).filter((_, i) => i !== index))
    }

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
        const baseCost = form.getValues("base_cost");

        if (field === 'percentage_from_base_cost') {
            const percentage = value || 0;
            const calculatedAmount = (baseCost * percentage) / 100;
            form.setValue(`payment_terms.${index}.percentage_from_base_cost`, value);
            form.setValue(`payment_terms.${index}.calculated_amount`, calculatedAmount);
        } else {
            const amount = value || 0;
            const calculatedPercentage = ((amount / baseCost) * 100).toFixed(2);
            form.setValue(`payment_terms.${index}.calculated_amount`, amount);
            form.setValue(`payment_terms.${index}.percentage_from_base_cost`, parseFloat(calculatedPercentage));
        }
    };

    // Function to recalculate all payment terms
    const recalculatePaymentTerms = (baseCost: number) => {
        if (!baseCost) return
        const paymentTerms = form.getValues("payment_terms");
        paymentTerms.forEach((term, index) => {
            const percentage = term.percentage_from_base_cost || 0;
            if (!percentage) return;
            const calculatedAmount = (baseCost * percentage) / 100;
            form.setValue(`payment_terms.${index}.calculated_amount`, calculatedAmount);
        });
    };

    const reCalculateBaseSeperationCost = (baseCost: number) => {
        baseCostSeparationFields.forEach((field, index) => {
            const percentage = field.percentage || 0;
            if (!percentage) return;
            const calculatedAmount = (baseCost * percentage) / 100;
            form.setValue(`base_cost_seperation.${index}.amount`, calculatedAmount);
        });
    }

    const recalculateAMCRateBasedOnBaseCost = (baseCost: number) => {
        const currentAmcRate = form.getValues("amc_rate");
        const amcPercentage = currentAmcRate.percentage || 0;

        const customizationCost = form.getValues("customization.cost") || 0;

        const amcTotalCost = (customizationCost || 0) + baseCost;
        const calculatedAmount = (amcTotalCost / 100) * amcPercentage;

        form.setValue("amc_rate.amount", calculatedAmount);
    };

    const recalculateAMCRate = (value: number, field: 'percentage' | 'amount') => {
        const baseCost = form.getValues("base_cost");

        const customizationCost = form.getValues("customization.cost") || 0;

        if (!baseCost) return;


        // Calculate total cost including base cost, license cost and customization
        const amcTotalCost = (customizationCost || 0) + baseCost;

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
        const customizationCost = parseFloat(form.getValues("customization.cost")?.toString() || "0");

        // Handle negative values by using Math.max
        const sanitizedBaseCost = Math.max(0, baseCost);

        const sanitizedCustomizationCost = Math.max(0, customizationCost);


        const totalCost = sanitizedBaseCost + sanitizedCustomizationCost;

        // Return 0 if calculation results in NaN or negative value
        return isNaN(totalCost) ? 0 : Math.max(0, totalCost);
    }

    const amcRateAfterCustomization = () => {
        const baseCost = parseFloat(form.getValues("base_cost")?.toString() || "0");
        const customizationCost = parseFloat(form.getValues("customization.cost")?.toString() || "0");

        const amcRate = form.getValues("amc_rate");


        const amcTotalCost = (customizationCost || 0) + baseCost;
        const amcRateAfterCustomization = (amcTotalCost * amcRate.percentage) / 100;

        return isNaN(amcRateAfterCustomization) ? 0 : Math.max(0, amcRateAfterCustomization);
    }

    useEffect(() => {
        form.setValue("total_cost", calculateTotalCost());
        form.setValue("amc_rate.amount", amcRateAfterCustomization());
    }, [
        form.watch("base_cost"),
        form.watch("customization.cost")
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
                if (fieldName.startsWith('amc_rate')) return 'amc_rate';
                if (fieldName.includes('payment_terms')) return 'payment_terms';
                return fieldName;
            };

            // Handler mapping
            const handlers = {
                base_cost: () => {
                    field.onChange(e);
                    recalculatePaymentTerms(value);
                    recalculateAMCRateBasedOnBaseCost(value);
                    reCalculateBaseSeperationCost(value);
                },
                base_cost_seperation: () => {
                    const [, index, term] = fieldName.split('.');
                    if (term === 'percentage') {
                        const calculatedAmount = (value * form.getValues(`base_cost`)) / 100;
                        form.setValue(`base_cost_seperation.${parseInt(index)}.amount`, calculatedAmount);
                        field.onChange(e);
                    } else {
                        const percentage = ((value / form.getValues(`base_cost`)) * 100).toFixed(2);
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
            customization: {
                cost: Number(data.customization?.cost) || 0,
                modules: data.customization?.modules || []
            },
            cost_per_license: Number(data.cost_per_license) || 0,
            licenses_with_base_price: Number(data.licenses_with_base_price) || 0
        };

        return transformedData;
    };

    const onSubmit: SubmitHandler<OrderDetailInputs & LicenseDetails> = async (data) => {
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

    const getSelectedProducts = useCallback(() => {
        const selectedProducts = form.watch("products") || [];
        return products.filter(product => selectedProducts.includes(product._id))
    }, [form, products]);


    const getProductById = (id: string) => products.find(product => product._id === id);

    const onProductSelectHandler = (selectedProducts: IProduct[]) => {
        // Add new selected products
        selectedProducts.forEach(product => {
            if (!baseCostSeparationFields.some(baseCostSeperation => baseCostSeperation.product_id === product._id)) {
                appendBaseCostSeperation({
                    product_id: product._id,
                    amount: 0,
                    percentage: 0
                })
            }
        });

        // Remove products that are no longer selected
        const selectedProductIds = selectedProducts.map(p => p._id);
        baseCostSeparationFields.forEach((field, index) => {
            if (!selectedProductIds.includes(field.product_id)) {
                removebaseCostSeparation(index);
            }
        });

        // if license is selected then add the license details
        if (selectedProducts.some(product => product.does_have_license)) {
            form.setValue("licenses_with_base_price", selectedProducts.find(product => product.does_have_license)?.default_number_of_licenses || 0)
        }
    }

    const createCustomizationModuleComboboxData = () => {
        const type = form.watch("customization.type") || "module"

        let data: ModuleData[] = []

        if (type === "report") {
            data = []
            // Create combobox data for modules from the selected products
            const selectedProducts = getSelectedProducts();
            selectedProducts.map(product => {
                const reports = product.reports || [];
                data.push(...reports.map(report => ({
                    name: `${product.name} - ${report.name}`,
                    key: report.key,
                    description: report.description
                })))
            });
        } else {
            // Create combobox data for modules from the selected products
            const selectedProducts = getSelectedProducts();
            selectedProducts.map(product => {
                const modules = product.modules || [];
                data.push(...modules.map(mod => ({
                    name: `${product.name} - ${mod.name}`,
                    key: mod.key,
                    description: mod.description
                })))
            });
        }
        return data
    }

    const getSelectModules = () => {
        const type = form.watch("customization.type") || "module"
        if (type === "module") {
            const selectedModules = form.watch("customization.modules") || []
            const allModules: ModuleData[] = []
            products.forEach(product => {
                const modules = product.modules || []
                allModules.push(...modules)
            })
            return allModules.filter(mod => selectedModules.includes(mod.key))
        }
        if (type === "report") {
            const selectedReports = form.watch("customization.reports") || []
            const allReports: ModuleData[] = []
            products.forEach(product => {
                const reports = product.reports || []
                allReports.push(...reports)
            })
            return allReports.filter(report => selectedReports.includes(report.key))
        }

        return []

    }

    const addCustomModuleInProduct = async (type: "module" | "report" = "module") => {
        if (!addNewModule.product || !addNewModule.add || !addNewModule.value) return
        const selectedProduct = products.find(p => p._id === addNewModule.product)
        if (!selectedProduct) return
        const key = type === "report" ? "reports" : "modules"
        try {
            const newModule = { key: addNewModule.value.toString().replaceAll(" ", "-"), name: addNewModule.value, description: addNewModule.description }
            await updateProductByIdApi({
                id: selectedProduct?._id,
                data: {
                    [key]: [...selectedProduct[key], newModule]
                }
            }).unwrap()
            appendCustomizationModule(newModule.key, type)
            setAddNewModule({ add: false, value: "", description: "" })
        } catch (error) {
            console.log(error)
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Error adding module'
            })
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

    const finalJSX = (
        <div className="mt-1 p-2">
            {defaultValue?._id && (
                <div className="mb-2 flex justify-end">
                    <Button className={`w-36 justify-between ${!disableInput ? "bg-destructive hover:bg-destructive" : ""}`} onClick={() => setDisableInput(prev => !prev)}>
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
                                            <FormLabel className='text-gray-500'>AMC Rate ({formatCurrency(form.watch("amc_rate.amount"))})</FormLabel>
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
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem className='w-full relative'>
                                            <FormLabel className='text-gray-500'>Order Status</FormLabel>
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
                                <div className=" hidden md:block w-full "></div>
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
                                    {/* <div className="mt-4">
                                        {renderFormField("licenses_with_base_price", "Licenses with Base Price", "Licenses with Base Price", "number")}
                                    </div> */}
                                    {/* <div className="flex justify-end mt-4">
                                        <Card className='items-center'>
                                            <CardContent className="flex items-center gap-2 justify-center p-3">
                                                <Typography variant='h3'>Total Cost</Typography>
                                                <Typography variant='p' className='flex items-center '>
                                                    <IndianRupee className='text-green-600 size-5' />
                                                    <span className="font-bold">{millify((form.watch("cost_per_license") || 0) * (form.watch("total_license") || 0), { precision: 2 })}</span>
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </div> */}
                                </div>

                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardContent className='p-6'>
                            <div className="">
                                <div className="flex items-center justify-between md:justify-start gap-4">
                                    <Typography variant='h3'>Customization</Typography>
                                    <Switch checked={enableCustomization} onCheckedChange={(val) => setEnableCustomization(val)} disabled={disableInput} />
                                </div>
                                {
                                    enableCustomization && (
                                        <div className="mt-2">
                                            <div className="md:flex items-start gap-4 w-full">
                                                {renderFormField("customization.cost", "Cost of Customization", "Enter customization cost which will add up in the Total Cost", "number")}
                                                <FormItem className='w-full relative'>
                                                    <FormLabel className='text-gray-500'>AMC Rate After Customozation</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type='number'
                                                            value={amcRateAfterCustomization()}
                                                            disabled
                                                            className="bg-white !m-0"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            </div>
                                            <div className="mt-2">
                                                <FormField
                                                    control={form.control}
                                                    name="customization.type"
                                                    render={({ field }) => (
                                                        <FormItem className='md:w-1/2 mb-4 md:mb-0'>
                                                            <FormLabel className='text-gray-500'>Type</FormLabel>
                                                            <FormControl>
                                                                <Select onValueChange={field.onChange}>
                                                                    <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                                        <SelectValue placeholder={`${(field.value || 'module').charAt(0).toUpperCase() + (field.value || 'module').slice(1)}`} />
                                                                    </SelectTrigger>
                                                                    <SelectContent className='bg-white'>
                                                                        {
                                                                            Object.values(CustomizationType).map((type) => (
                                                                                <SelectItem value={type} key={type}>
                                                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
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
                                            </div>
                                            <div className="mt-2 md:mt-4">
                                                <ModulesCombobox
                                                    data={createCustomizationModuleComboboxData()}
                                                    customizationModulesFields={form.watch("customization.type") === "report" ? reportFields : customizationModulesFields}
                                                    disableInput={disableInput}
                                                    appendCustomizationModule={appendCustomizationModule}
                                                    removeCustomizationModule={removeCustomizationModule}
                                                    setAddNewModule={setAddNewModule}
                                                    type={form.watch("customization.type") || "module"}
                                                />
                                                <div className="mt-3 md:w-1/2 w-11/12 max-h-96 overflow-y-auto">
                                                    {
                                                        getSelectModules()?.map((mod, index) => (
                                                            <div className="mb-4 gap-2 relative" key={mod.key}>
                                                                <Typography variant='h3' className='text-sm font-bold'>{mod.name}</Typography>
                                                                <Typography variant='p' className='text-xs !text-gray-800 font-medium'>{mod.description || "No Description"}</Typography>
                                                                <div className="absolute top-0 right-0 cursor-pointer" onClick={() => !disableInput && removeCustomizationModule(index, form.watch("customization.type") || "module")}>
                                                                    <X className={disableInput ? "text-gray-500" : "text-black"} />
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                                <Dialog open={addNewModule.add} onOpenChange={(val) => !val && setAddNewModule({ add: false, value: "", description: "" })}>
                                                    <DialogContent>
                                                        <DialogTitle>Add New Module</DialogTitle>
                                                        <DialogDescription className='!mt-0'>This module will automatically will be added in the products</DialogDescription>
                                                        {
                                                            addNewModule.add && (
                                                                <div className="">
                                                                    <FormItem className='w-full mb-4 md:mb-0'>
                                                                        <FormControl>
                                                                            <Select onValueChange={(value) => {
                                                                                setAddNewModule(prev => ({ ...prev, product: value as string }))
                                                                            }}>
                                                                                <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                                                    <SelectValue placeholder={"Select a Product"} />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {
                                                                                        products?.map((product) => (
                                                                                            <SelectItem value={String(product._id)} key={product._id}>
                                                                                                {String(product.name)}
                                                                                            </SelectItem>
                                                                                        ))
                                                                                    }
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                    <Input placeholder='Title' className='mt-3' onChange={(e) => setAddNewModule(prev => ({ ...prev, value: e.target.value }))} />
                                                                    <Textarea placeholder='Description' className='mt-3 resize-none' rows={4} onChange={(e) => setAddNewModule(prev => ({ ...prev, description: e.target.value }))} />

                                                                    <DialogFooter className='mt-4'>
                                                                        <Button variant='default' className='!p-3 ' type='button' onClick={() => addCustomModuleInProduct(addNewModule.type)}>
                                                                            Create
                                                                        </Button>
                                                                    </DialogFooter>

                                                                </div>
                                                            )
                                                        }
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                    )
                                }
                            </div>
                        </CardContent>
                    </Card>

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
                                                    {renderFormField(`payment_terms.${index}.percentage_from_base_cost`, "Percentage from Base Cost", "Percentage", "number")}
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
                                                    <Button variant='destructive' onClick={() => removePaymentTerm(index)} className='flex-shrink-0 w-8 h-8 rounded-full' disabled={disableInput}>
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
                                            {formatCurrency(form.watch("amc_rate.amount"))}
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
                                                <FormLabel className='text-gray-500'>AMC Start Date</FormLabel>
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
                                        agreementDateFields.map((_, index: number) => (
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
                                                <Button variant='destructive' onClick={() => removeAgreementDateField(index)} className='w-full mt-2 md:mt-2 md:rounded-full md:w-8 md:h-8 ' disabled={disableInput}>
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