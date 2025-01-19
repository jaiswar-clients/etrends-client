import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";
import { 
  OrderDetailInputs, 
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
  CustomizationType,
  IPendingPayment,
  IPendingPaymentPagination,
  IPendingPaymentType
} from "@/types/order";

// Re-export types that are used by other components
export type {
  IOrderObject,
  TransformedAMCObject,
  IPendingPayment,
  IPendingPaymentPagination,
  IPendingPaymentType,
  IUpdatePendingPaymentRequest
};
export { PAYMENT_STATUS_ENUM };

import { clientApi } from "./client";
import { ILicenseInputs } from "@/components/Purchase/Form/LicenseForm";
import { IAdditionalServiceInputs } from "@/components/Purchase/Form/AdditionalServiceForm";
import { ICustomizationInputs } from "@/components/Purchase/Form/CustomizationForm";
import { IAmcInputs } from "@/components/AMC/AMCDetail";
import { AMC_FILTER } from "@/components/AMC/AMC";

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
      { page?: number; limit?: number }
    >({
      query: (body) =>
        `/all-orders?page=${body.page || 1}&limit=${body.limit || 10}`,
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
    updateAMCByOrderId: builder.mutation<
      IResponse,
      { orderId: string; data: IAmcInputs }
    >({
      query: ({ orderId, data }) => ({
        url: `/${orderId}/amc`,
        method: HTTP_REQUEST.PATCH,
        body: data,
      }),
      invalidatesTags: ["AMC_DATA", "AMC_LIST"],
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
      IResponse<TransformedAMCObject[]>,
      {
        page?: number;
        limit?: number;
        filter?: AMC_FILTER;
        options: { upcoming: number; startDate?: Date; endDate?: Date };
      }
    >({
      query: (body) =>
        `/all-amc?page=${body.page || 1}&limit=${10}&filter=${
          body.filter
        }&upcoming=${body.options.upcoming}&startDate=${body.options.startDate}&endDate=${body.options.endDate}`,
      providesTags: ["AMC_LIST"],
    }),
    getAllPendingPayments: builder.query<
      IResponse<IPendingPaymentResponse>,
      { page?: number; limit?: number }
    >({
      query: (body) =>
        `/pending-payments?page=${body.page || 1}&limit=${body.limit || 10}`,
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
  useUpdateAMCByOrderIdMutation,
  useGetAdditionalServiceByIdQuery,
  useGetCustomizationByIdQuery,
  useGetLicenceByIdQuery,
  useUpdateCustomizationByIdMutation,
  useUpdateLicenseByIdMutation,
  useUpdateAdditionalServiceByIdMutation,
  useGetAllAMCQuery,
  useGetAllPendingPaymentsQuery,
  useUpdatePendingPaymentMutation,
} = orderApi;
