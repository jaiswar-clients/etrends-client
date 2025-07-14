import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";

const orderAiUrl = `${process.env.NEXT_PUBLIC_API_URL}/order-ai`;

export const orderAiApi = createApi({
  reducerPath: "orderAi",
  baseQuery: fetchBaseQuery({
    baseUrl: orderAiUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getCustomerProductAdoptionReport: builder.query<
      IResponse<{ markdown: string }>,
      void
    >({
      query: () => ({
        url: `/customer-product-adoption-report`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    getIndustryProductDistributionReport: builder.query<
      IResponse<{ markdown: string }>,
      void
    >({
      query: () => ({
        url: `/industry-product-distribution-report`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    getDomesticInternationalRevenueReport: builder.query<
      IResponse<{ markdown: string }>,
      { enableThinking?: boolean }
    >({
      query: ({ enableThinking }) => ({
        url: `/domestic-international-revenue-report`,
        method: HTTP_REQUEST.GET,
        params: { enableThinking },
      }),
    }),
    getDirectFranchiseSalesReport: builder.query<
      IResponse<{ markdown: string }>,
      { enableThinking?: boolean }
    >({
      query: ({ enableThinking }) => ({
        url: `/direct-franchise-sales-report`,
        method: HTTP_REQUEST.GET,
        params: { enableThinking },
      }),
    }),
    getProductRealisationVariationReport: builder.query<
      IResponse<{ markdown: string }>,
      { enableThinking?: boolean }
    >({
      query: ({ enableThinking }) => ({
        url: `/product-realisation-variation-report`,
        method: HTTP_REQUEST.GET,
        params: { enableThinking },
      }),
    }),
    getUpsellPotentialClientsReport: builder.query<
      IResponse<{ markdown: string }>,
      { enableThinking?: boolean }
    >({
      query: ({ enableThinking }) => ({
        url: `/upsell-potential-clients-report`,
        method: HTTP_REQUEST.GET,
        params: { enableThinking },
      }),
    }),
    getCrossSellOpportunitiesReport: builder.query<
      IResponse<{ markdown: string }>,
      { enableThinking?: boolean }
    >({
      query: ({ enableThinking }) => ({
        url: `/cross-sell-opportunities-report`,
        method: HTTP_REQUEST.GET,
        params: { enableThinking },
      }),
    }),
    getPartnerPerformanceReport: builder.query<
      IResponse<{ markdown: string }>,
      { enableThinking?: boolean }
    >({
      query: ({ enableThinking }) => ({
        url: `/partner-performance-report`,
        method: HTTP_REQUEST.GET,
        params: { enableThinking },
      }),
    }),
  }),
});

export const {
  useGetCustomerProductAdoptionReportQuery,
  useGetIndustryProductDistributionReportQuery,
  useGetDomesticInternationalRevenueReportQuery,
  useGetDirectFranchiseSalesReportQuery,
  useGetProductRealisationVariationReportQuery,
  useGetUpsellPotentialClientsReportQuery,
  useGetCrossSellOpportunitiesReportQuery,
  useGetPartnerPerformanceReportQuery,
} = orderAiApi; 