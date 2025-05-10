import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";
import {
  IOrderObject,
  CreateOrderRequest,
  ILicenceObject,
  ICustomizationObject,
  IAdditionalServiceObject,
  TransformedAMCObject,
  PAYMENT_STATUS_ENUM,
  IAMCObject,
  IUpdateOrderRequest,
  IPendingPaymentResponse,
  IUpdatePendingPaymentRequest,
  IPurchase,
  IPendingPayment,
  IPendingPaymentPagination,
  IPendingPaymentType,
  IAMCPayment,
  IAMCPaymentReview,
  IOrderFilterCompanyResponse,
} from "@/types/order";

// Re-export types that are used by other components
export type {
  IOrderObject,
  TransformedAMCObject,
  IPendingPayment,
  IPendingPaymentPagination,
  IPendingPaymentType,
  IUpdatePendingPaymentRequest,
};
export { PAYMENT_STATUS_ENUM };

import { clientApi } from "./client";
import { ILicenseInputs } from "@/components/Purchase/Form/LicenseForm";
import { IAdditionalServiceInputs } from "@/components/Purchase/Form/AdditionalServiceForm";
import { ICustomizationInputs } from "@/components/Purchase/Form/CustomizationForm";
import { AMC_FILTER } from "@/components/AMC/AMC";
import { ORDER_STATUS_ENUM } from "@/types/client";

const orderUrl = `${process.env.NEXT_PUBLIC_API_URL}/orders`;

export const orderApi = createApi({
  reducerPath: "order",
  baseQuery: fetchBaseQuery({
    baseUrl: orderUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "ORDER_DATA",
    "CLIENT_ORDERS_DATA",
    "ORDERS_LIST",
    "AMC_DATA",
    "CUSTOMIZATION_DATA",
    "LICENSE_DATA",
    "ADDITIONAL_SERVICE_DATA",
    "AMC_PAYMENT_REVIEW",
    "AMC_LIST",
    "PENDING_PAYMENTS_LIST",
  ],
  endpoints: (builder) => ({
    getOrderById: builder.query<IResponse<IOrderObject>, string>({
      query: (clientId) => `/${clientId}`,
      providesTags: ["ORDER_DATA"],
    }),
    getAllOrdersWithAttributes: builder.query<
      IResponse<{
        purchases: IPurchase[];
        pagination: {
          total: number;
          limit: number;
          page: number;
          pages: number;
        };
      }>,
      {
        page?: number;
        limit?: number;
        parent_company_id?: string;
        client_id?: string;
        client_name?: string;
        product_id?: string;
        status?: ORDER_STATUS_ENUM;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (body) => {
        const params = new URLSearchParams();
        if (body.page) params.append("page", body.page.toString());
        if (body.limit) params.append("limit", body.limit.toString());
        if (body.parent_company_id)
          params.append("parent_company_id", body.parent_company_id);
        if (body.client_id) params.append("client_id", body.client_id);
        if (body.client_name) params.append("client_name", body.client_name);
        if (body.product_id) params.append("product_id", body.product_id);
        if (body.status) params.append("status", body.status);
        if (body.startDate) params.append("startDate", body.startDate);
        if (body.endDate) params.append("endDate", body.endDate);
        return `/all-orders?${params.toString()}`;
      },
      providesTags: ["ORDERS_LIST"],
    }),
    createOrder: builder.mutation<IResponse, CreateOrderRequest>({
      query: (body) => ({
        url: `/${body.client_id}`,
        method: HTTP_REQUEST.POST,
        body,
      }),
      invalidatesTags: ["ORDER_DATA", "CLIENT_ORDERS_DATA", "ORDERS_LIST"],
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        await queryFulfilled;
        dispatch(
          clientApi.util.invalidateTags(["CLIENT_LIST", "CLIENT_DETAIL"])
        );
      },
    }),
    updateOrder: builder.mutation<IResponse, IUpdateOrderRequest>({
      query: (body) => ({
        url: `/${body.orderId}`,
        method: HTTP_REQUEST.PATCH,
        body,
      }),
      invalidatesTags: ["ORDER_DATA", "CLIENT_ORDERS_DATA", "AMC_DATA"],
      async onQueryStarted(arg, { queryFulfilled, dispatch }) {
        await queryFulfilled;
        dispatch(
          clientApi.util.invalidateTags(["CLIENT_LIST", "CLIENT_DETAIL"])
        );
      },
    }),
    getAllClientOrders: builder.query<IResponse<IOrderObject[]>, string>({
      query: (clientId) => `/client/${clientId}`,
    }),
    addLicense: builder.mutation<
      IResponse,
      ILicenseInputs & { order_id: string }
    >({
      query: (body) => ({
        url: `/${body.order_id}/license`,
        method: HTTP_REQUEST.POST,
        body,
      }),
      invalidatesTags: ["ORDERS_LIST"],
    }),
    addAdditionalService: builder.mutation<
      IResponse,
      IAdditionalServiceInputs & { order_id: string }
    >({
      query: (body) => ({
        url: `/${body.order_id}/additional-service`,
        method: HTTP_REQUEST.POST,
        body,
      }),
      invalidatesTags: ["ORDERS_LIST"],
    }),
    addCustomization: builder.mutation<
      IResponse,
      ICustomizationInputs & { order_id: string }
    >({
      query: (body) => ({
        url: `/${body.order_id}/customization`,
        method: HTTP_REQUEST.POST,
        body,
      }),
      invalidatesTags: ["ORDERS_LIST", "AMC_DATA"],
    }),
    getAmcByOrderId: builder.query<IResponse<IAMCObject>, string>({
      query: (orderId) => `/${orderId}/amc`,
      providesTags: ["AMC_DATA"],
    }),
    getLicenceById: builder.query<IResponse<ILicenceObject>, string>({
      query: (licenceId) => `/license/${licenceId}`,
      providesTags: ["LICENSE_DATA"],
    }),
    getCustomizationById: builder.query<
      IResponse<ICustomizationObject>,
      string
    >({
      query: (customizationId) => `/customization/${customizationId}`,
      providesTags: ["CUSTOMIZATION_DATA"],
    }),
    getAdditionalServiceById: builder.query<
      IResponse<IAdditionalServiceObject>,
      string
    >({
      query: (additionalServiceId) =>
        `/additional-service/${additionalServiceId}`,
      providesTags: ["ADDITIONAL_SERVICE_DATA"],
    }),
    updateCustomizationById: builder.mutation<
      IResponse,
      ICustomizationInputs & { id: string }
    >({
      query: (body) => ({
        url: `/customization/${body.id}`,
        method: HTTP_REQUEST.PATCH,
        body,
      }),
      invalidatesTags: ["ORDERS_LIST", "CUSTOMIZATION_DATA"],
    }),
    updateLicenseById: builder.mutation<
      IResponse<ILicenceObject>,
      ILicenseInputs & { id: string }
    >({
      query: (body) => ({
        url: `/license/${body.id}`,
        method: HTTP_REQUEST.PATCH,
        body,
      }),
      invalidatesTags: ["ORDERS_LIST", "LICENSE_DATA"],
    }),
    updateAdditionalServiceById: builder.mutation<
      IResponse<IAdditionalServiceObject>,
      IAdditionalServiceInputs & { id: string }
    >({
      query: (body) => ({
        url: `/additional-service/${body.id}`,
        method: HTTP_REQUEST.PATCH,
        body,
      }),
      invalidatesTags: ["ORDERS_LIST", "ADDITIONAL_SERVICE_DATA"],
    }),
    getAllAMC: builder.query<
      IResponse<{
        pagination: {
          total: number;
          limit: number;
          page: number;
          pages: number;
        };
        data: TransformedAMCObject[];
        total_amount: {
          [key in AMC_FILTER]: number;
        } & {
          total?: number;
        };
      }>,
      {
        page?: number;
        limit?: number;
        filter?: AMC_FILTER;
        options: { startDate?: string; endDate?: string };
        client_id?: string;
        product_id?: string;
      }
    >({
      query: (body) =>
        `/all-amc?page=${body.page || 1}&limit=${10}&filter=${
          body.filter
        }&startDate=${body.options.startDate}&endDate=${
          body.options.endDate
        }&client_id=${body.client_id || ""}&product_id=${
          body.product_id || ""
        }`,
      providesTags: ["AMC_LIST"],
    }),
    getAllPendingPayments: builder.query<
      IResponse<IPendingPaymentResponse>,
      {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        clientId?: string;
        clientName?: string; // Added clientName for potential future use, though API might only use clientId
        type?: "order" | "amc" | "all"; // Added type filter
      }
    >({
      query: (body) => {
        const params = new URLSearchParams();
        if (body.page) params.append("page", body.page.toString());
        if (body.limit) params.append("limit", body.limit.toString());
        if (body.startDate) params.append("startDate", body.startDate);
        if (body.endDate) params.append("endDate", body.endDate);
        if (body.clientId) params.append("clientId", body.clientId);
        if (body.type) params.append("type", body.type);
        // if (body.clientName) params.append('clientName', body.clientName); // Uncomment if API supports clientName filter
        return `/pending-payments?${params.toString()}`;
      },
      providesTags: ["PENDING_PAYMENTS_LIST"],
    }),
    updatePendingPayment: builder.mutation<
      IResponse,
      IUpdatePendingPaymentRequest
    >({
      query: (body) => ({
        url: `/pending-payments/${body._id}`,
        method: HTTP_REQUEST.PATCH,
        body,
      }),
      invalidatesTags: ["PENDING_PAYMENTS_LIST"],
    }),
    updateAMCPaymentById: builder.mutation<
      IResponse,
      {
        id: string;
        paymentId: string;
        data: Partial<IAMCPayment>;
      }
    >({
      query: ({ id, paymentId, data }) => ({
        url: `/amc/${id}/payment/${paymentId}`,
        method: HTTP_REQUEST.PATCH,
        body: data,
      }),
      invalidatesTags: ["AMC_PAYMENT_REVIEW", "AMC_DATA"],
    }),
    updateAMCById: builder.mutation<
      IResponse,
      { id: string; data: Partial<IAMCObject> }
    >({
      query: ({ id, data }) => ({
        url: `/amc/${id}`,
        method: HTTP_REQUEST.PATCH,
        body: data,
      }),
      invalidatesTags: ["AMC_DATA"],
    }),
    deleteAMCPaymentById: builder.mutation<
      IResponse,
      { amcId: string; paymentId: string }
    >({
      query: ({ amcId, paymentId }) => ({
        url: `/amc/${amcId}/payment/${paymentId}`,
        method: HTTP_REQUEST.DELETE,
      }),
      invalidatesTags: ["AMC_DATA"],
    }),
    getAMCPaymentReview: builder.mutation<
      IResponse<IAMCPaymentReview[]>,
      string
    >({
      query: (orderId) => ({
        url: `/amc-payments-review/${orderId}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    addAmcPayments: builder.mutation<
      IResponse,
      { amcId: string; payments: IAMCPaymentReview[] }
    >({
      query: (body) => ({
        url: `/amc/${body.amcId}/payments`,
        method: HTTP_REQUEST.PATCH,
        body: body.payments,
      }),
      invalidatesTags: ["AMC_PAYMENT_REVIEW", "AMC_DATA"],
    }),
    deleteOrderById: builder.mutation<IResponse, string>({
      query: (id) => ({
        url: `/${id}`,
        method: HTTP_REQUEST.DELETE,
      }),
      invalidatesTags: ["ORDERS_LIST", "CLIENT_ORDERS_DATA"],
    }),
    getOrderFiltersOfCompany: builder.query<
      IResponse<IOrderFilterCompanyResponse>,
      void
    >({
      query: () => ({
        url: `/filters/company-data`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    exportAmcToExcel: builder.mutation<
      Blob,
      {
        filter: string;
        startDate?: string;
        endDate?: string;
        client_id?: string;
        product_id?: string;
      }
    >({
      query: (params) => ({
        url: `/export-amc`,
        method: HTTP_REQUEST.GET,
        params,
        responseHandler: async (response) => {
          const blob = await response.blob();
          return blob;
        },
      }),
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useUpdateOrderMutation,
  useGetAllClientOrdersQuery,
  useAddLicenseMutation,
  useAddAdditionalServiceMutation,
  useAddCustomizationMutation,
  useGetAllOrdersWithAttributesQuery,
  useGetAmcByOrderIdQuery,
  useGetAdditionalServiceByIdQuery,
  useGetCustomizationByIdQuery,
  useGetLicenceByIdQuery,
  useUpdateCustomizationByIdMutation,
  useUpdateLicenseByIdMutation,
  useUpdateAdditionalServiceByIdMutation,
  useGetAllAMCQuery,
  useGetAllPendingPaymentsQuery,
  useUpdatePendingPaymentMutation,
  useUpdateAMCPaymentByIdMutation,
  useGetAMCPaymentReviewMutation,
  useAddAmcPaymentsMutation,
  useUpdateAMCByIdMutation,
  useDeleteOrderByIdMutation,
  useDeleteAMCPaymentByIdMutation,
  useGetOrderFiltersOfCompanyQuery,
  useExportAmcToExcelMutation,
} = orderApi;
