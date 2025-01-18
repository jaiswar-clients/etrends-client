import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import Typography from '@/components/ui/Typography'
import { useGetPurchasedProductsByClientQuery } from '@/redux/api/client'
import { CustomizationDetails, CustomizationType } from '@/types/order'
import { ChevronsUpDown, CircleCheck, CirclePlus, CircleX, File, Pencil, Plus, X } from 'lucide-react'
import React, { HTMLInputTypeAttribute, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useFileUpload } from '@/hooks/useFileUpload'
import DatePicker from '@/components/ui/datepicker'
import { useToast } from '@/hooks/use-toast'
import { ICustomizationObject, PAYMENT_STATUS_ENUM } from '@/redux/api/order'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { renderDisabledInput } from '@/components/ui/disabledInput'
import { IProduct } from '@/types/product'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"
import { useUpdateProductByIdMutation } from '@/redux/api/product'
import { Textarea } from '@/components/ui/textarea'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ICustomationProps {
    clientId: string
    handler: (data: ICustomizationInputs, orderId?: string) => void
    isLoading?: boolean
    label?: string
    disable?: boolean
    defaultValue?: ICustomizationObject
}

export interface ICustomizationInputs extends CustomizationDetails {
    product_id: string;
    invoice_document: string;
    invoice_number: string;
    invoice_date?: Date;
    purchase_order_number: string;
    title?: string;
}

export interface ModuleData {
    key: string;
    name: string;
    description: string;
}

interface ModulesComboboxProps {
    data: ModuleData[];
    customizationModulesFields: string[];
    disableInput: boolean;
    appendCustomizationModule: (key: string, type?: "module" | "report") => void;
    removeCustomizationModule: (index: number, type?: "module" | "report") => void;
    setAddNewModule: React.Dispatch<
        React.SetStateAction<{
            add: boolean;
            value: string;
            description: string;
            type?: "module" | "report";
        }>
    >;
    type?: "module" | "report";
}

export function ModulesCombobox({
    data,
    customizationModulesFields,
    disableInput,
    appendCustomizationModule,
    removeCustomizationModule,
    setAddNewModule,
    type = "module",
}: ModulesComboboxProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className="flex justify-start items-center gap-2">
                <FormLabel className="text-gray-500">
                    {type === "module" ? "Modules" : "Reports"}
                </FormLabel>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between"
                        disabled={disableInput}
                    >
                        {`Select ${type}...`}
                        <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
            </div>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${type}...`} />
                    <CommandList>
                        <CommandEmpty>No {type} found.</CommandEmpty>
                        <CommandGroup>
                            {data.map((module) => (
                                <CommandItem
                                    key={module.key}
                                    value={module.key}
                                    onSelect={() => {
                                        setOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <span>{module.name}</span>
                                        {customizationModulesFields.includes(module.key) ? (
                                            <Button
                                                variant="destructive"
                                                disabled={disableInput}
                                                className="ml-auto !p-3"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeCustomizationModule(
                                                        customizationModulesFields.indexOf(module.key),
                                                        type
                                                    );
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="default"
                                                disabled={disableInput}
                                                className="ml-auto !p-3"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    appendCustomizationModule(module.key, type);
                                                }}
                                            >
                                                <CirclePlus className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                <div className="p-2 border-t">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                            setAddNewModule((prev) => ({ ...prev, add: true, type }))
                        }
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}


const CustomizationForm: React.FC<ICustomationProps> = ({ clientId, handler, isLoading = false, label, disable = false, defaultValue }) => {
    const [amcRate, setAmcRate] = useState({ percentage: 0, amount: 0, total_amount: 0 })
    const { data: productsList } = useGetPurchasedProductsByClientQuery(clientId)
    const { uploadFile, getFileNameFromUrl } = useFileUpload()
    const [selectedProduct, setSelectedProduct] = useState<IProduct | null>()
    const [addNewModule, setAddNewModule] = useState<{ add: boolean, value: string, type?: "report" | "module", description: string }>({ add: false, value: '', description: '' })

    const [updateProductByIdApi] = useUpdateProductByIdMutation()
    const [disableInput, setDisableInput] = useState(disable)

    const { toast } = useToast()

    const values = defaultValue && {
        product_id: defaultValue.product_id,
        cost: defaultValue.cost,
        modules: defaultValue.modules,
        purchase_order_document: defaultValue.purchase_order_document,
        purchase_order_number: defaultValue.purchase_order_number,
        purchased_date: defaultValue.purchased_date ? new Date(defaultValue.purchased_date) : undefined,
        type: defaultValue.type,
        invoice_document: defaultValue.invoice_document,
        invoice_number: defaultValue.invoice_number,
        invoice_date: defaultValue.invoice_date ? new Date(defaultValue.invoice_date) : undefined,
        title: defaultValue?.title || "",
        reports: defaultValue?.reports || [],
        payment_status: defaultValue?.payment_status || PAYMENT_STATUS_ENUM.PENDING,
        payment_receive_date: defaultValue?.payment_receive_date ? new Date(defaultValue.payment_receive_date) : undefined
    }

    const defaultValues = {
        product_id: defaultValue?.product_id || '',
        cost: defaultValue?.cost || 0,
        modules: defaultValue?.modules || [],
        purchase_order_document: defaultValue?.purchase_order_document || '',
        purchase_order_number: defaultValue?.purchase_order_number || '',
        purchased_date: defaultValue?.purchased_date ? new Date(defaultValue.purchased_date) : undefined,
        type: defaultValue?.type || CustomizationType.MODULE,
        invoice_document: defaultValue?.invoice_document || '',
        invoice_number: defaultValue?.invoice_number || '',
        invoice_date: defaultValue?.invoice_date ? new Date(defaultValue.invoice_date) : undefined,
        title: defaultValue?.title || "",
        reports: defaultValue?.reports || [],
        payment_status: defaultValue?.payment_status || PAYMENT_STATUS_ENUM.PENDING,
        payment_receive_date: defaultValue?.payment_receive_date ? new Date(defaultValue.payment_receive_date) : undefined
    }


    const form = useForm<ICustomizationInputs>({
        defaultValues: defaultValues,
        ...(defaultValue && {
            values
        })
    })

    useEffect(() => {
        if (disable !== undefined) setDisableInput(disable)
    }, [disable])

    useEffect(() => {
        if (defaultValue?.product_id) {
            const product = productsList?.data.find((product) => product._id === defaultValue.product_id)
            if (product) {
                setAmcRate({ percentage: product.amc_rate.percentage, amount: product.amc_rate.amount, total_amount: product.total_cost })
                setSelectedProduct(product)
            }
        }
    }, [defaultValue?.product_id, productsList])

    const customizationModulesFields = form.watch("modules")
    const reportFields = form.watch("reports") || []
    const appendCustomizationModule = (value: string, type: "module" | "report" = "module") => {
        if (type === "module") form.setValue("modules", [...customizationModulesFields, value])
        else form.setValue("reports", [...(reportFields || []), value])
    }

    const removeCustomizationModule = (index: number, type: "module" | "report" = "module") => {
        if (type === "module")
            form.setValue("modules", customizationModulesFields.filter((_, i) => i !== index))
        else
            form.setValue("reports", (reportFields || []).filter((_, i) => i !== index))
    }

    const getSignedUrl = async (file: File, name: "invoice_document" | "purchase_order_document") => {
        const filename = await uploadFile(file);
        form.setValue(name, filename as string)
    }

    const renderFormField = (name: `modules.${number}` | keyof ICustomizationInputs, label: string | null, placeholder: string, type: HTMLInputTypeAttribute = "text") => {
        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file && (name === 'invoice_document' || name === 'purchase_order_document')) {
                await getSignedUrl(file, name);
            }
        };

        const renderFilePreview = (field: any) => {
            return (
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
        };

        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            form.setValue(name, e.target.value)
            if (name === 'cost') recalculateAMCAmount()
        }

        return (
            <FormField
                control={form.control}
                name={name as any}
                render={({ field }) => (
                    <FormItem className='w-full mb-4 md:mb-0'>
                        {label && (
                            <FormLabel className='text-gray-500 relative block w-fit'>
                                {label}
                                {(type === "file" && field.value && !disableInput) && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                {renderFilePreview(field)}
                                            </TooltipTrigger>
                                            <TooltipContent>{getFileNameFromUrl(field.value as string) || 'View File'}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </FormLabel>
                        )}
                        <FormControl>
                            {(type === "file" && field.value && disableInput) ? (
                                renderFilePreview(field)
                            ) : (
                                <Input
                                    type={type}
                                    {...field}
                                    onChange={type === 'file' ? (e) => handleFileChange(e) : onChange}
                                    value={(type === 'number' && field.value === 0) ? '' : (type === 'file' ? undefined : field.value as string)}
                                    disabled={disableInput}
                                    className='bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                    placeholder={placeholder}
                                />
                            )}
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    }

    const addCustomModuleInProduct = async (type: "module" | "report" = "module") => {
        if (!selectedProduct || !addNewModule.add || !addNewModule.value) return
        const key = type === "report" ? "reports" : "modules"
        try {
            const newModule = { key: addNewModule.value.toString().replaceAll(" ", "-"), name: addNewModule.value, description: addNewModule.description }
            const product = await updateProductByIdApi({
                id: selectedProduct?._id,
                data: {
                    [key]: [...selectedProduct[key], newModule]
                }
            }).unwrap()
            setSelectedProduct(product.data)
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

    const onSubmit = async (data: ICustomizationInputs) => {
        const missingFields = [];
        if (!data.product_id) missingFields.push('Product');
        if (!data.cost) missingFields.push('Cost');
        if (!data.invoice_document) missingFields.push('Invoice Document');
        if (!data.purchased_date) missingFields.push('Purchased Date');
        if (!data.modules.length) missingFields.push('Modules');

        if (missingFields.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Required Fields Missing',
                description: `Please fill the following fields: ${missingFields.join(', ')}`
            })
            return
        }

        if (data.payment_status === PAYMENT_STATUS_ENUM.PAID && !data.payment_receive_date) {
            toast({
                variant: 'destructive',
                title: 'Required Fields Missing',
                description: 'Please fill the Payment Receive Date'
            })
            return
        }

        const product = productsList?.data.find((product) => product._id === data.product_id)
        if (!product) {
            throw new Error('Product not found')
        }
        await handler({ ...data, cost: Number(data.cost) }, product.order_id)
    }

    const selectPlaceHolder = (name: "product_id" | "type", value: string) => {
        if (!value) return "Select a Product"

        const placeholders = {
            product_id: () => productsList?.data.find(product => product._id === value)?.name,
            type: () => value.charAt(0).toUpperCase() + value.slice(1)
        }

        return placeholders[name]?.() || "Select a Product"
    }

    const recalculateAMCAmount = () => {
        const amcPercentage = amcRate.percentage
        const amcTotalAmount = amcRate.total_amount
        const customizationAmount = form.getValues('cost') || 0

        const newAmcTotalAmount = ((Number(customizationAmount) + amcTotalAmount) * amcPercentage) / 100
        setAmcRate(prev => ({ ...prev, amount: newAmcTotalAmount }))
    }

    const getSelectedCustomizationModules = () => {
        return selectedProduct?.modules.filter(mod => customizationModulesFields.includes(mod.key))
    }

    const getSelectedCustomizationReports = () => {
        return selectedProduct?.reports.filter(mod => reportFields.includes(mod.key))
    }

    const renderDynamicFields = (type: string) => {

        switch (type) {
            case CustomizationType.MODULE:
                return (
                    <>
                        <ModulesCombobox
                            data={selectedProduct?.modules || []}
                            customizationModulesFields={customizationModulesFields}
                            disableInput={disableInput}
                            appendCustomizationModule={appendCustomizationModule}
                            removeCustomizationModule={removeCustomizationModule}
                            setAddNewModule={setAddNewModule}
                        />
                        <div className="mt-4 md:w-1/2">
                            {getSelectedCustomizationModules()?.map((mod, index) => (
                                <div className="mb-4 gap-2 relative" key={mod.key}>
                                    <Input disabled value={mod.name} />
                                    <Textarea disabled value={mod.description} className='resize-none mt-2' />
                                    <Button type='button' variant='destructive' disabled={disableInput} className='!p-3 absolute -top-7 -right-4' onClick={() => removeCustomizationModule(index, "module")}>
                                        <X />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                )
            case CustomizationType.REPORT:
                return (
                    <>
                        <ModulesCombobox
                            data={selectedProduct?.reports || []}
                            customizationModulesFields={reportFields}
                            disableInput={disableInput}
                            appendCustomizationModule={appendCustomizationModule}
                            removeCustomizationModule={removeCustomizationModule}
                            setAddNewModule={setAddNewModule}
                            type="report"
                        />

                        <div className="mt-4 md:w-1/2">
                            {getSelectedCustomizationReports()?.map((mod, index) => (
                                <div className=" items-center mb-4 gap-2" key={mod.key}>
                                    <div className="mb-4 gap-2 relative" key={mod.key}>
                                        <Input disabled value={mod.name} />
                                        <Textarea disabled value={mod.description} className='resize-none mt-2' />
                                        <Button type='button' variant='destructive' disabled={disableInput} className='!p-3 absolute -top-7 -right-4' onClick={() => removeCustomizationModule(index, "report")}>
                                            <X />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )
            default:
                return (
                    <>
                        <ModulesCombobox
                            data={selectedProduct?.modules || []}
                            customizationModulesFields={customizationModulesFields}
                            disableInput={disableInput}
                            appendCustomizationModule={appendCustomizationModule}
                            removeCustomizationModule={removeCustomizationModule}
                            setAddNewModule={setAddNewModule}
                        />
                        <div className="mt-4 md:w-1/2">
                            {getSelectedCustomizationModules()?.map((mod, index) => (
                                <div className="mb-4 gap-2 relative" key={mod.key}>
                                    <Input disabled value={mod.name} />
                                    <Textarea disabled value={mod.description} className='resize-none mt-2' />
                                    <Button type='button' variant='destructive' disabled={disableInput} className='!p-3 absolute -top-7 -right-4' onClick={() => removeCustomizationModule(index)}>
                                        <X />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                )

        }
    }

    return (
        <div className="bg-custom-gray bg-opacity-75 rounded p-4">
            <div className="flex items-center justify-between">
                <Typography variant='h1'>{label}</Typography>
                {defaultValue?._id && (
                    <div className="mb-2 flex justify-end">
                        <Button className={`md:w-36 justify-between ${!disableInput ? "bg-destructive hover:bg-destructive" : ""}`}
                            onClick={() => setDisableInput(prev => !prev)}>
                            {disableInput ? (
                                <>
                                    <Pencil />
                                    <span className='hidden md:block'>Start Editing</span>
                                </>
                            ) : (
                                <>
                                    <CircleX />
                                    <span className='hidden md:block'>Close Editing</span>
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        {renderFormField('title', 'Title', 'Enter Title', 'text')}
                        <FormField
                            control={form.control}
                            name="product_id"
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>Product ID</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={(value) => {
                                            field.onChange(value)
                                            const product = productsList?.data.find((product) => product._id === value)
                                            if (product) {
                                                setAmcRate({ percentage: product.amc_rate.percentage, amount: product.amc_rate.amount, total_amount: product.total_cost })
                                                setSelectedProduct(product)
                                            }
                                        }}>
                                            <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                <SelectValue placeholder={selectPlaceHolder('product_id', field.value)} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {
                                                    productsList?.data.map((product) => (
                                                        <SelectItem value={product._id} key={product._id}>{product.name}</SelectItem>
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
                            name="cost"
                            render={() => (
                                <FormItem className='w-full'>
                                    <FormLabel className='text-gray-500'>Cost</FormLabel>
                                    <FormControl>
                                        {renderFormField('cost', null, 'Enter Price', "number")}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>Type</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange}>
                                            <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                <SelectValue placeholder={selectPlaceHolder("type", field.value || '')} />
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


                        <div className="md:flex items-center gap-4 w-full">
                            {renderFormField('purchase_order_document', 'Purchase Order Document', 'Upload Purchase Order Document', 'file')}
                            {renderFormField('invoice_document', 'Invoice Document', 'Upload Invoice Document', 'file')}
                        </div>
                        <div className="md:flex items-end gap-4 w-full">
                            {renderFormField('purchase_order_number', 'Purchase Order Number', 'Enter purchase order number', 'text')}
                            {renderFormField('invoice_number', 'Invoice Number', 'Enter invoice number', 'text')}
                        </div>
                        <div className="md:flex items-end gap-4 w-full">
                            <FormField
                                control={form.control}
                                name="invoice_date"
                                render={({ field }) => (
                                    <FormItem className='w-full mb-4 md:mb-0'>
                                        <FormLabel className='text-gray-500'>Invoice Date</FormLabel>
                                        <FormControl>
                                            <DatePicker
                                                date={field.value}
                                                onDateChange={field.onChange}
                                                disabled={disableInput}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="purchased_date"
                            render={({ field }) => (
                                <FormItem className='w-full'>
                                    <FormLabel className='text-gray-500'>Purchased Date</FormLabel>
                                    <FormControl>
                                        <DatePicker date={field.value} disabled={disableInput} onDateChange={field.onChange} placeholder='Pick end date' />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="w-full md:flex items-center gap-4">
                            {renderDisabledInput("AMC Percentage", amcRate.percentage, "number")}
                            {renderDisabledInput("AMC Amount", amcRate.amount, "number")}
                        </div>

                        <FormField
                            control={form.control}
                            name={`payment_status`}
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>Payment Status</FormLabel>
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
                            name={`payment_receive_date`}
                            render={({ field }) => (
                                <FormItem className='w-full relative'>
                                    <FormLabel className='text-gray-500'>Payment Receive Date</FormLabel>
                                    <FormControl>
                                        <DatePicker date={field.value} onDateChange={field.onChange} placeholder='Payment Receive Date' disabled={disableInput} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="gap-5">
                        {renderDynamicFields(form.getValues("type") as string || CustomizationType.MODULE)}

                        <Dialog open={addNewModule.add} onOpenChange={(val) => !val && setAddNewModule({ add: false, value: "", description: "" })}>
                            <DialogContent>
                                <DialogTitle>Add New Module</DialogTitle>
                                <DialogDescription className='!mt-0'>This module will automatically will be added in the products</DialogDescription>
                                {
                                    addNewModule.add && (
                                        <div className="">
                                            <Input placeholder='Title' onChange={(e) => setAddNewModule(prev => ({ ...prev, value: e.target.value }))} />
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



                    <div className="flex justify-end">
                        <Button type="submit" className='md:w-48 w-full py-5 md:py-2' disabled={isLoading || disableInput} loading={{ isLoading, loader: "tailspin" }} >
                            <CircleCheck />
                            <span className='text-white'>Save Customization</span>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}

export default CustomizationForm