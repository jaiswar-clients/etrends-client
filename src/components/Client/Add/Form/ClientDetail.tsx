"use client"
import Typography from '@/components/ui/Typography'
import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { industriesArray } from '@/contants/client'
import { CirclePlus, X, Edit, CircleX, Plus, CircleCheck } from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useRouter } from 'next/navigation'
import { ClientDetailsInputs } from '@/types/client'
import { IClientDataObject, useGetAllParentCompaniesQuery } from '@/redux/api/client'
import { decrypt } from '@/utils/crypto'

enum AMC_FREQUENCY {
    MONTHLY = 1,
    QUARTERLY = 3,
    HALF_YEARLY = 6,
    YEARLY = 12
}

interface IProps {
    handler: (data: ClientDetailsInputs) => Promise<string>
    disable?: boolean
    defaultValue?: IClientDataObject,
    disableAccordion?: boolean
}

const ClientDetail: React.FC<IProps> = ({ handler, disable = false, defaultValue, disableAccordion = false }) => {
    const [disableInput, setDisableInput] = useState(disable)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const [filteredParentCompany, setFilteredParentCompany] = useState<{ _id: string, name: string }[]>([])
    const [parentCompanyInput, setParentCompanyInput] = useState({ show: false, value: "" })

    const { data: parentCompanies } = useGetAllParentCompaniesQuery(undefined)

    useEffect(() => {
        if (parentCompanies && parentCompanies.data.length) setFilteredParentCompany(parentCompanies.data)
    }, [parentCompanies])

    useEffect(() => {
        if (defaultValue?._id && defaultValue.parent_company?.name) setParentCompanyInput(prev => ({ ...prev, value: defaultValue.parent_company.name }))
    }, [defaultValue])

    const form = useForm<ClientDetailsInputs>({
        defaultValues: {
            parent_company: {
                id: "",
                name: "",
                new: false
            },
            name: "",
            pan_number: "",
            gst_number: "",
            industry: "",
            vendor_id: "",
            client_id: "",
            point_of_contacts: [{ name: '', email: '', phone: '', designation: '', opt_for_email_reminder: false }],
            address: "",
            amc_frequency_in_months: 12
        },
        ...(defaultValue && {
            values: {
                parent_company: defaultValue?.parent_company || {},
                name: defaultValue.name,
                pan_number: defaultValue?.pan_number ? decrypt(defaultValue.pan_number) : "",
                gst_number: defaultValue?.gst_number ? decrypt(defaultValue.gst_number) : "",
                industry: defaultValue.industry || "",
                vendor_id: defaultValue?.vendor_id ? decrypt(defaultValue.vendor_id as string) : "",
                client_id: defaultValue?.client_id || "",
                point_of_contacts: defaultValue?.point_of_contacts || [],
                address: defaultValue?.address || "",
                amc_frequency_in_months: defaultValue?.amc_frequency_in_months || 12
            }
        })
    })

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "point_of_contacts"
    });
    const onSubmit: SubmitHandler<ClientDetailsInputs> = async (data) => {
        setIsLoading(true)
        try {
            const dbClientId = await handler({ ...data, amc_frequency_in_months: Number(data.amc_frequency_in_months) })
            if (!defaultValue?._id && dbClientId)
                router.push(`/clients/${dbClientId}`)
            else if (defaultValue?._id)
                setDisableInput(true)
            setIsLoading(false)
        } catch (error) {
            console.error("Error submitting form:", error)
        }
    }

    const renderFormField = (name: keyof ClientDetailsInputs | `point_of_contacts.${number}.${keyof ClientDetailsInputs['point_of_contacts'][number]}`, label: string, placeholder: string, type: string = "text") => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className='w-full mb-3 md:mb-0'>
                    <FormLabel className='text-gray-500'>{label}</FormLabel>
                    <FormControl>
                        <Input disabled={disableInput} className='bg-white' placeholder={placeholder} type={type} {...field} value={field.value as string} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );

    const handleInputChange = (value: string) => {
        if (value) {
            setFilteredParentCompany(parentCompanies?.data?.filter(company => company.name.toLowerCase().includes(value.toLowerCase())) || [])
        } else {
            setFilteredParentCompany(parentCompanies?.data || [])
        }
        setParentCompanyInput(prev => ({ ...prev, value }))
    }

    const finalJsx = (
        <div className="mt-1 p-0 md:p-2">
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="md:flex items-end gap-4 w-full">
                        {renderFormField("name", "Name", "Client name")}
                        {renderFormField("client_id", "Client ID", "Client ID")}
                    </div>
                    <div className="md:flex items-center gap-4 w-full !mt-4">
                        {renderFormField("pan_number", "Pan Number", "Company Pan Number")}
                        {renderFormField("gst_number", "GST Number", "Client GST Number")}
                    </div>
                    <div className="md:flex items-start flex-row-reverse gap-4 w-full !mt-4">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className='w-full mb-2 md:mb-2'>
                                    <FormLabel className='text-gray-500'>Address</FormLabel>
                                    <FormControl>
                                        <Textarea disabled={disableInput} className='bg-white resize-none' placeholder="Client Address" {...field} rows={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="w-full">
                            <FormField
                                control={form.control}
                                name="industry"
                                render={({ field }) => (
                                    <FormItem className='w-full mb-3'>
                                        <FormLabel className='text-gray-500'>Industry</FormLabel>
                                        <FormControl>
                                            <Select onValueChange={field.onChange} disabled={disableInput} value={field.value}>
                                                <SelectTrigger className="w-full bg-white">
                                                    <SelectValue placeholder="Select Industry" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {industriesArray.map((industry) => (
                                                        <SelectItem key={industry.value} value={industry.value}>
                                                            {industry.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {renderFormField("vendor_id", "Vendor ID", "Vendor ID")}

                        </div>
                    </div>
                    <div className="md:flex items-start gap-4 w-full !mt-4">
                        <FormField
                            control={form.control}
                            name="amc_frequency_in_months"
                            render={({ field }) => (
                                <FormItem className='w-full mb-4 md:mb-0'>
                                    <FormLabel className='text-gray-500'>AMC Frequency</FormLabel>
                                    <FormControl>
                                        <Select onValueChange={field.onChange}>
                                            <SelectTrigger className="w-full bg-white" disabled={disableInput}>
                                                <SelectValue placeholder={field.value} />
                                            </SelectTrigger>
                                            <SelectContent className='bg-white'>
                                                {
                                                    Object.entries(AMC_FREQUENCY)
                                                        .filter(([key]) => isNaN(Number(key)))
                                                        .map(([_key, value]) => (
                                                            <SelectItem value={value.toString()} key={_key}>
                                                                {value} {value === 1 ? 'month' : 'months'}
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
                        <FormItem className="w-full">
                            <FormLabel className='text-gray-500'>Parent Company</FormLabel>
                            <div className="relative">
                                <Input
                                    className=''
                                    disabled={disableInput}
                                    onFocus={() => setParentCompanyInput(prev => ({ ...prev, show: true }))}
                                    onBlur={() => setTimeout(() => setParentCompanyInput(prev => ({ ...prev, show: false })), 300)}
                                    placeholder="Enter or select a company..."
                                    value={parentCompanyInput.value}
                                    onChange={(e) => handleInputChange(e.target.value)}
                                />
                                {
                                    parentCompanyInput.show && (
                                        <div className="bg-white rounded-b-md shadow-md mt-1 absolute z-30 w-full m-h-40 overflow-y-auto">
                                            {
                                                filteredParentCompany.map((company) => (
                                                    <div key={company._id} className="flex items-center justify-between p-2  cursor-pointer hover:bg-gray-50" onClick={() => {
                                                        form.setValue("parent_company.id", company?._id)
                                                        form.setValue("parent_company.name", company?.name)
                                                        form.setValue("parent_company.new", false)
                                                        setParentCompanyInput(prev => ({ ...prev, value: company?.name }))
                                                    }}>
                                                        <Typography variant='p' className='text-sm'>{company?.name}</Typography>
                                                    </div>
                                                ))
                                            }
                                            {
                                                parentCompanyInput && filteredParentCompany.length === 0 && (
                                                    <div className="flex items-center justify-center p-2 w-full gap-2 cursor-pointer" onClick={() => {
                                                        form.setValue("parent_company.new", true)
                                                        form.setValue("parent_company.id", "")
                                                        form.setValue("parent_company.name", parentCompanyInput?.value)
                                                    }}>
                                                        <Plus className='!w-6 !h-6' />
                                                        <Typography variant='p' className='text-sm'>
                                                            Add {parentCompanyInput?.value}
                                                        </Typography>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    )
                                }
                            </div>

                        </FormItem>
                    </div>

                    <div className="mt-6">
                        <Typography variant='h4'>Point of Contacts(POC)</Typography>

                        {fields.map((field, index) => (
                            <div key={field.id} className={`md:flex justify-between items-end mt-2 gap-4 relative ${fields.length > 1 ? "mb-6" : ""} rounded p-2 bg-white`}>
                                {renderFormField(`point_of_contacts.${index}.name`, "Name", "Name")}
                                {renderFormField(`point_of_contacts.${index}.email`, "Email", "Email", "email")}
                                {renderFormField(`point_of_contacts.${index}.phone`, "Phone", "Phone")}
                                {renderFormField(`point_of_contacts.${index}.designation`, "Designation", "Designation")}
                                {/* <Button
                                    type='button'
                                    onClick={() => toggleReminder(index)}
                                    className={`bg-[#1D0259] text-white hover:bg-[#2A037A] transition-colors duration-200 ${form.watch(`point_of_contacts.${index}.opt_for_email_reminder`) ? 'ring-2 ring-offset-2 ring-[#1D0259]' : ''
                                        }`}
                                    disabled={disableInput}
                                >
                                    <Bell />
                                </Button> */}

                                {index > 0 && !disableInput && (
                                    <Button
                                        type='button'
                                        variant="destructive"
                                        onClick={() => remove(index)}
                                        className="mt-2 absolute -top-4 -right-2 rounded-full w-5 h-8"
                                    >
                                        <X />
                                    </Button>
                                )}
                            </div>
                        ))}

                        <div className="flex justify-center mt-4">
                            <Button
                                disabled={disableInput}
                                type='button'
                                onClick={() => append({ name: '', email: '', phone: '', designation: '', opt_for_email_reminder: false })}
                                className="flex items-center justify-center gap-2 py-5 md:w-72 bg-[#E6E6E6] text-black hover:bg-black hover:text-white group"
                            >
                                <CirclePlus className='!w-6 !h-6' />
                                <Typography variant='p' className='text-black group-hover:text-white'>Add more POC</Typography>
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={disableInput} loading={{ isLoading, loader: "tailspin" }} className='w-full md:w-36 '>
                            <CircleCheck />
                            <span className='text-white'>Save changes</span>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )

    return (
        <div className='bg-custom-gray bg-opacity-75 rounded p-4'>
            {
                disableAccordion ? finalJsx : (
                    <Accordion type="single" collapsible defaultChecked >
                        <AccordionItem value={"client-detail"}>
                            <AccordionTrigger>
                                <Typography variant='h1'>Client Details</Typography>
                            </AccordionTrigger>
                            <AccordionContent>
                                {finalJsx}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )
            }
        </div>
    )
}

export default ClientDetail
