"use client"
import Typography from '@/components/ui/Typography'
import React, { useState } from 'react'
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
import { CircleCheck, CircleX, Pencil, Plus } from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { IProduct } from '@/types/product'
import { toast } from '@/hooks/use-toast'
interface IProps {
    handler: (data: IProductInputs) => Promise<void>
    disable?: boolean
    defaultValue?: IProduct,
    removeAccordion?: boolean
}

export type IProductInputs = Omit<IProduct, '_id'>

const CreateProduct: React.FC<IProps> = ({ handler, disable = false, defaultValue, removeAccordion }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [disableInput, setDisableInput] = useState(disable)

    const form = useForm<IProductInputs>({
        defaultValues: {
            name: "",
            short_name: "",
            does_have_license: false,
            description: "",
            modules: [],
            reports: [],
            default_number_of_licenses: 0
        },
        ...(defaultValue && {
            values: {
                name: defaultValue.name,
                short_name: defaultValue.short_name,
                does_have_license: defaultValue.does_have_license,
                description: defaultValue.description,
                modules: defaultValue.modules || [],
                reports: defaultValue.reports || [],
                default_number_of_licenses: defaultValue.default_number_of_licenses || 0
            }
        })
    })

    const { fields: modulesField, append: appendModules, remove: removeModules } = useFieldArray({
        control: form.control,
        name: "modules"
    })

    const { fields: reportsField, append: appendReports, remove: removeReports } = useFieldArray({
        control: form.control,
        name: "reports"
    })

    const onSubmit: SubmitHandler<IProductInputs> = async (data) => {
        setIsLoading(true)
        // Check if any required field empty and use toast to show error message
        if (!data.name || !data.short_name || !data.description) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Please fill all the required fields"
            })
            setIsLoading(false)
            return
        }

        // Add keys to the modules array ifs its name is present, key is small letter name and if any space the  - is added
        data.modules = data.modules.map(mod => {
            if (mod.name) {
                mod.key = mod.name.toLowerCase().replace(" ", "-")
            }
            return mod
        })

        // Add keys to the reports array ifs its name is present, key is small letter name and if any space the  - is added
        data.reports = data.reports.map(mod => {
            if (mod.name) {
                mod.key = mod.name.toLowerCase().replace(" ", "-")
            }
            return mod
        })

        data.default_number_of_licenses = Number(data.default_number_of_licenses) || 0

        try {
            await handler(data)
            setIsLoading(false)
        } catch (error) {
            console.error(error)
            setIsLoading(false)
        }
    }

    const renderFormField = (name: "name" | "short_name" | "description" | "default_number_of_licenses", label: string, placeholder: string) => (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className='w-full mb-2 md:mb-0'>
                    <FormLabel className='text-gray-500'>{label}</FormLabel>
                    <FormControl>
                        <Input disabled={disableInput} className='bg-white' placeholder={placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )

    const finalJSX = (
        <div className="mt-1 p-2 w-full">
            <div className="flex items-center justify-between w-full mb-4">
                <div className=""></div>
                <Button className={`w-36 justify-between ${!disableInput ? "bg-destructive hover:bg-destructive" : ""}`} onClick={() => setDisableInput(prev => !prev)}>
                    {disableInput ? (
                        <>
                            <Pencil />
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

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="md:flex items-center gap-4 w-full">
                        {renderFormField("name", "Product Name", "Enter product name")}
                        {renderFormField("short_name", "Short Name", "Enter short name")}
                    </div>

                    <FormField
                        control={form.control}
                        name="does_have_license"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        License Required
                                    </FormLabel>
                                </div>
                                <FormControl>
                                    <Switch
                                        disabled={disableInput}
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {
                        form.watch("does_have_license") && <div className='md:w-1/2 '>
                            {renderFormField("default_number_of_licenses", "Default Number of Licenses", "Enter default number of licenses")}
                        </div>
                    }

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className='text-gray-500'>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        disabled={disableInput}
                                        className='bg-white resize-none'
                                        placeholder="Product description"
                                        {...field}
                                        rows={5}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="">
                        <Typography variant='p' className='font-semibold'>Modules</Typography>
                        <div className={`flex flex-col gap-4 mt-2  ${modulesField.length ? "items-center" : " items-start"} `} >
                            {
                                modulesField.map((field, index) => (
                                    <div key={field.id} className="flex items-start gap-4 w-full relative">
                                        <FormField
                                            control={form.control}
                                            name={`modules.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem className='w-full'>
                                                    <FormControl>
                                                        <Input
                                                            disabled={disableInput}
                                                            className='bg-white'
                                                            placeholder="Module Name"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`modules.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem className='w-full '>
                                                    <FormControl>
                                                        <Textarea
                                                            disabled={disableInput}
                                                            className='bg-white'
                                                            placeholder="Description"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div
                                            className='absolute -right-4 -top-4 p-2 cursor-pointer'
                                            onClick={() => removeModules(index)}
                                        >
                                            <CircleX />
                                        </div>
                                    </div>
                                ))
                            }
                            <Button
                                className='w-36 justify-between'
                                onClick={() => appendModules({ name: "", key: "", description: "" })}
                                type='button'
                                disabled={disableInput}
                            >
                                <Plus className='!w-6 !h-6' />
                                <span>Add Module</span>
                            </Button>
                        </div>
                    </div>
                    <div className="">
                        <Typography variant='p' className='font-semibold'>Reports</Typography>
                        <div className={`flex flex-col gap-4 mt-2  ${modulesField.length ? "items-center" : " items-start"} `} >
                            {
                                reportsField.map((field, index) => (
                                    <div key={field.id} className="flex items-start gap-4 w-full relative">
                                        <FormField
                                            control={form.control}
                                            name={`reports.${index}.name`}
                                            render={({ field }) => (
                                                <FormItem className='w-full'>
                                                    <FormControl>
                                                        <Input
                                                            disabled={disableInput}
                                                            className='bg-white'
                                                            placeholder="Module Name"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`reports.${index}.description`}
                                            render={({ field }) => (
                                                <FormItem className='w-full '>
                                                    <FormControl>
                                                        <Textarea
                                                            disabled={disableInput}
                                                            className='bg-white'
                                                            placeholder="Description"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div
                                            className='absolute -right-4 -top-4 p-2 cursor-pointer'
                                            onClick={() => removeReports(index)}
                                        >
                                            <CircleX />
                                        </div>
                                    </div>
                                ))
                            }
                            <Button
                                className='w-36 justify-between'
                                onClick={() => appendReports({ name: "", key: "", description: "" })}
                                type='button'
                                disabled={disableInput}
                            >
                                <Plus className='!w-6 !h-6' />
                                <span>Add Module</span>
                            </Button>
                        </div>
                    </div>


                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={disableInput || !form.formState.isDirty || isLoading || !form.formState.isValid}
                            loading={{ isLoading, loader: "tailspin" }}
                            className='w-34'
                        >
                            <CircleCheck />
                            <span className='text-white'>Save Product</span>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )

    return (
        <div className='bg-custom-gray bg-opacity-75 rounded p-4'>
            {
                removeAccordion ? finalJSX : (
                    <Accordion type="single" collapsible defaultValue="product-detail">
                        <AccordionItem value="product-detail">
                            <AccordionTrigger>
                                <Typography variant='h1'>Product Details</Typography>
                            </AccordionTrigger>
                            <AccordionContent>
                                {finalJSX}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )
            }
        </div>
    )
}

export default CreateProduct