"use client"
import { IEmailTemplate, REMINDER_TEMPLATES, useGetEmailTemplatesQuery, useGetReminderByIdQuery, useSentEmailToClientMutation } from '@/redux/api/reminder'
import React, { useEffect, useState } from 'react'
import Loading from '../ui/loading'
import Typography from '../ui/Typography'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ReminderAMCDetail from './ReminderAMCDetail'
import { useAppSelector } from '@/redux/hook'
import EmailBodyEditor from '../RichTextEditor/RichTextEditor'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { Input } from '../ui/input'
import { Button } from '@/components/ui/button'
import { Expand, Send } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useGetInternalTeamEmailQuery } from '@/redux/api/app'


interface IProps {
  id: string
  emailIndex: number
}

function dynamicVariableParser(content: string, templateVariables: any[], data: { [key: string]: string }) {
  let parsedContent = content;
  templateVariables.forEach(variable => {
    const value = data[variable.field] || '';
    parsedContent = parsedContent.replaceAll(variable.key, value);
  });
  return parsedContent;
}

export interface IEmailInputProps {
  subject: string
  body: string
  from: string
  to: string
  bcc?: string
  cc?: string
  client_id?: string;
  order_id?: string;
  amc_id?: string;
  license_id?: string;
  customization_id?: string;
  email_template_id: string;
}

const Email: React.FC<IProps> = ({ id, emailIndex }) => {
  const { data } = useGetReminderByIdQuery(id)
  const { data: emailTemplateApiRes } = useGetEmailTemplatesQuery()
  const { data: internalEmailsApiRes } = useGetInternalTeamEmailQuery()

  const products = useAppSelector((state) => state.user.products)

  const [selectedTemplate, setSelectedTemplate] = useState<Partial<IEmailTemplate>>({ key: "", name: "", content: "", dynamic_variables: [] })
  const [emailBodyContent, setEmailBodyContent] = useState("")

  const [sendEmailToClientApi, { isLoading }] = useSentEmailToClientMutation()

  const form = useForm<IEmailInputProps>({
    defaultValues: {
      subject: "",
      body: "",
      from: "",
      to: "",
      bcc: "",
      cc: "",
    }
  })

  let payload: { [key: string]: string } = {}

  const emailBody = (template: IEmailTemplate) => {
    if (!template || !reminder) return

    switch (template.key) {
      case REMINDER_TEMPLATES.SEND_PENDING_AMC_REMINDER:
        payload = {
          name: data?.data?.client.point_of_contacts[emailIndex]?.name || "",
          email: form.getValues("to"),
          amc_cycle: String(reminder?.context?.amc?.cycle || ""),
          amount: String(reminder?.context?.amc?.amount || ""),
          amc_date: String(reminder?.context?.amc?.date || ""),
          client_id: reminder?.client?._id || "",
          amc_id: reminder?.amc?._id || "",
          order_id: reminder?.order?._id || "",
          email_template_id: template._id
        }
        break;
      case REMINDER_TEMPLATES.SEND_UPCOMING_AMC_REMINDER:
        payload = {
          name: data?.data?.client.point_of_contacts[emailIndex]?.name || "",
          product_name: getProductNames(reminder?.order?.products || []) || "",
          amc_cycle: String(reminder?.context?.amc?.cycle || ""),
          amount: String(reminder?.context?.amc?.amount || ""),
          upcoming: String(reminder?.context?.amc?.upcoming || 0),
          client_id: reminder?.client?._id || "",
          amc_id: reminder?.amc?._id || "",
          order_id: reminder?.order?._id || "",
          email_template_id: template._id
        }
        break;
      case REMINDER_TEMPLATES.SEND_AGREEMENT_EXPIRY_REMINDER:
        payload = {
          contact_name: data?.data?.client.point_of_contacts[emailIndex]?.name || "",
          name: reminder?.client?.name || "",
          product: getProductNames(reminder?.order?.products || []) || "",
          expiry_date: String(reminder?.context?.agreement?.expiryDate || ""),
          upcoming: String(reminder?.context?.agreement?.upcoming || 0),
          client_id: reminder?.client?._id || "",
          amc_id: reminder?.amc?._id || "",
          order_id: reminder?.order?._id || "",
          email_template_id: template._id
        }
        break;
    }

    if (template) {
      const emailBody = dynamicVariableParser(template.content, template.dynamic_variables, payload)
      setEmailBodyContent(emailBody)
      form.setValue("body", emailBody)
    }

  }

  useEffect(() => {
    if (data?.data) {
      form.setValue("to", data.data.client.point_of_contacts[emailIndex].email)
      form.setValue("subject", data.data.subject || "")
      const template = emailTemplateApiRes?.data.find((template) => template.key === data.data.template)
      if (template) {
        emailBody(template)
        setSelectedTemplate(template)
      }
    }
    if (internalEmailsApiRes?.data) {
      form.setValue("from", internalEmailsApiRes?.data[0].email)
    }

  }, [data?.data, internalEmailsApiRes])


  if (!data?.data) return <Loading />

  const reminder = data.data
  const client = data.data.client


  const getProductNames = (productIds: string[]) => {
    if (!products) return ""
    return productIds.map((id) => {
      const product = products.find((product) => product._id === id)
      return product?.name || ""
    }).join(", ")
  }

  const contactInfos = data.data.client.point_of_contacts

  const renderReminderInfo = () => {
    switch (data.data.template) {
      case REMINDER_TEMPLATES.SEND_PENDING_AMC_REMINDER:
        return <ReminderAMCDetail
          reminderId={reminder._id}
          clientName={reminder?.client.name || ""}
          productName={getProductNames(reminder?.order?.products) || ""}
          amcCycle={reminder?.context.amc.cycle || ""}
          amcAmount={reminder?.context.amc.amount || ""}
          amcDueDate={reminder?.context.amc.date || ""}
          overduedays={reminder?.context.amc.overdue || 0}
          upcomingDays={reminder?.context.amc.upcomingDays || 0}
          contacts={reminder?.client.point_of_contacts || []}
          amcLink={`/amc/${reminder?.amc._id}`}
          showContacts={false}
          type={reminder?.template === REMINDER_TEMPLATES.SEND_PENDING_AMC_REMINDER ? "pending" : reminder?.template === REMINDER_TEMPLATES.SEND_UPCOMING_AMC_REMINDER ? "upcoming" : "pending"}
          clientId={reminder?.client._id || ""}
        />
    }
  }

  const onSubmit = async (data: IEmailInputProps) => {
    // validate
    if (!data.from || !data.to || !data.subject || !data.body) {
      toast({
        variant: "destructive",
        description: "Please fill all fields"
      })
      return
    }

    try {
      const emailPayload = {
        ...data,
        to: data.to,
        from: data.from,
        subject: data.subject,
        body: data.body,
        email_template_id: selectedTemplate._id as string,
        ...(reminder?.client?._id && { client_id: reminder.client._id }),
        ...(reminder?.order?._id && { order_id: reminder.order._id }),
        ...(reminder?.amc?._id && { amc_id: reminder.amc._id }),
      };

      await sendEmailToClientApi(emailPayload).unwrap();
      toast({
        variant: "success",
        description: "Email sent successfully"
      })

    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        description: "Failed to send email"
      })
    }
  }

  return (
    <div>
      <Typography variant='h1' className=''>Send Reminder Email To {client.name}</Typography>
      <div className="py-4">
        {renderReminderInfo()}
      </div>
      <div className="flex justify-end">
        <Select onValueChange={(val) => {
          const template = emailTemplateApiRes?.data.find((template) => template.key === val)
          if (template) {
            setSelectedTemplate(template || { id: "", name: "" })
            emailBody(template)
          }
        }}>
          <SelectTrigger className="min-w-[180px] max-w-fit" >
            <SelectValue placeholder={selectedTemplate.name || "Select a Template"} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Templates</SelectLabel>
              {emailTemplateApiRes?.data.map((template) => (
                <SelectItem
                  value={template.key}
                  className='cursor-pointer'
                  key={template.key}
                >
                  {template.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex  items-start gap-3 h-full ">
        <div className="border rounded-lg relative p-4 bg-card text-card-foreground h-full w-4/5 prose [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_th]:border [&_th]:border-gray-300 [&_th]:p-2">
          <div className="absolute top-1 right-1 cursor-pointer">
            <Dialog>
              <DialogTrigger>
                <Expand className='size-5' />
              </DialogTrigger>
              <DialogContent className='max-w-full'>
                <DialogTitle></DialogTitle>
                <div dangerouslySetInnerHTML={{
                  __html: form.getValues("body")
                }} />
              </DialogContent>
            </Dialog>

          </div>
          <div dangerouslySetInnerHTML={{
            __html: form.getValues("body")
          }} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='md:w-full rounded-lg border bg-card text-card-foreground shadow-sm p-4' >
            <FormField
              name="from"
              control={form.control}
              render={({ field }) => (
                <FormItem className=' mb-4'>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Select onValueChange={(val) => field.onChange(val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sender email" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {internalEmailsApiRes?.data?.map((email) => (
                            <SelectItem key={email.email} value={email.email}>
                              {email.email}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="to"
              control={form.control}
              render={({ field }) => (
                <FormItem className=' mb-4'>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Select onValueChange={(val) => field.onChange(val)} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={field.value || "Select recipient email"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {contactInfos?.map((contact) => (
                            <SelectItem key={contact.email} value={contact.email}>
                              {contact.name} ({contact.email})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="cc"
              control={form.control}
              render={({ field }) => (
                <FormItem className=' mb-4'>
                  <FormLabel>CC</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="bcc"
              control={form.control}
              render={({ field }) => (
                <FormItem className=' mb-4'>
                  <FormLabel>BCC</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="subject"
              control={form.control}
              render={({ field }) => (
                <FormItem className=' mb-4'>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="body"
              control={form.control}
              render={({ field }) => (
                <FormItem className=''>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <EmailBodyEditor value={emailBodyContent} onChange={(content) => {
                      field.onChange(content)
                      setEmailBodyContent(content)
                    }} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end mt-4 ">
              <Button type="submit" className='w-full' disabled={isLoading} loading={{ isLoading, loader: "tailspin" }}>
                <Send className="mr-2" />
                Send Email
              </Button>
            </div>
          </form>

        </Form>
      </div>
    </div>
  )
}

export default Email