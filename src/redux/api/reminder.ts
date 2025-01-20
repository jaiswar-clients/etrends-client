import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";
import { IClientDataObject } from "./client";
import { IAMCObject, IOrderObject } from "@/types/order";
import { IEmailInputProps } from "@/components/Reminder/ReminderEmail";
import { HTTP_REQUEST } from "@/contants/request";

const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/reminders`;

export enum REMINDER_TEMPLATES {
  SEND_UPCOMING_AMC_REMINDER = "amc-upcoming-reminder",
  SEND_PENDING_AMC_REMINDER = "amc-pending-reminder",
  SEND_AGREEMENT_EXPIRY_REMINDER = "agreement-expiry-reminder",
}

export interface IEmailTemplate {
  _id: string;
  key: string;
  name: string;
  content: string;
  dynamic_variables: {
    _id: string;
    key: string;
    field: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReminderObject {
  from: string;
  to: string;
  _id: string;
  subject: string;
  template: REMINDER_TEMPLATES;
  email_template: IEmailTemplate;
  body: string;
  communication_type: string;
  context: any;
  status: "sent" | "failed";
  client: IClientDataObject;
  order: IOrderObject;
  amc: IAMCObject & { _id: string };
  license_id: string;
  customization_id: string;
  reminder_id: string;
  total_attempts: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const reminderApi = createApi({
  reducerPath: "reminder",
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getReminders: builder.query<IResponse<IReminderObject[]>, void>({
      query: () => ``,
    }),
    getReminderById: builder.query<IResponse<IReminderObject>, string>({
      query: (id) => `${id}`,
    }),
    sentEmailToClient: builder.mutation<IResponse, IEmailInputProps>({
      query: (body) => ({
        url: `send-email-to-client`,
        method: HTTP_REQUEST.POST,
        body,
      }),
    }),
    getEmailTemplates: builder.query<IResponse<IEmailTemplate[]>, void>({
      query: () => `email/templates`,
    }),
    getExternalCommunicationHistory: builder.query<
      IResponse<(IReminderObject & { email_template: IEmailTemplate })[]>,
      void
    >({
      query: () => `email/external/history`,
    }),
  }),
});

export const {
  useGetReminderByIdQuery,
  useGetRemindersQuery,
  useSentEmailToClientMutation,
  useGetEmailTemplatesQuery,
  useGetExternalCommunicationHistoryQuery,
} = reminderApi;
