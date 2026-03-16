import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";

const reportUrl = `${process.env.NEXT_PUBLIC_API_URL}/reports`;

export type IReportFilters = "monthly" | "quarterly" | "yearly" | "all";

export interface IReportQueries {
  filter: IReportFilters;
  options?: {
    startDate?: Date;
    endDate?: Date;
    year?: number;
    quarter?: string;
  };
}

export interface IDetailedOverAllSalesReportResponse {
  period: string;
  orderRevenue: number;
  customizationRevenue: number;
  licenseRevenue: number;
  additionalServiceRevenue: number;
  amcRevenue: number;
  total: number;
}

export interface IAMCAnnualBreakDown {
  period: string;
  totalExpected: number;
  totalCollected: number;
}

export interface IIndustryWiseRevenue {
  industry: string;
  period: string;
  total: number;
  [key: string]: any;
}

export interface IProductWiseRevenueReportResponse {
  productId: string;
  productName: string;
  revenue: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface ITotalBillingReport {
  period: string;
  total_amc_billing: number;
  total_purchase_billing: number;
}

export interface IExpectedVsReceivedRevenue {
  period: string;
  expected_amount: number;
  received_amount: number;
}

// ==================== NEW REVENUE DASHBOARD TYPES ====================

export interface IMonthlyRevenueBreakdown {
  period: string;
  newSalesRevenue: number;
  amcRevenue: number;
  totalRevenue: number;
}

export interface IRevenueDashboardResponse {
  summary: {
    totalNewSalesRevenue: number;
    totalAMCRevenue: number;
    grandTotalRevenue: number;
  };
  monthlyBreakdown: IMonthlyRevenueBreakdown[];
}

export interface IPeriodBreakdown {
  period: string;
  expected: number;
  collected: number;
}

export interface IExpectedVsCollectedResponse {
  fiscalYear: string;
  newSales: {
    expected: number;
    collected: number;
    breakdown: IPeriodBreakdown[];
  };
  amc: {
    expected: number;
    collected: number;
    breakdown: IPeriodBreakdown[];
  };
  total: {
    expected: number;
    collected: number;
  };
}

export interface IMonthlyBreakdownDetail {
  orderId: string;
  clientName: string;
  productName: string;
  amount: number;
  status: string;
  date: Date;
}

export interface IMonthlyBreakdown {
  period: string;
  newSales: {
    total: number;
    details: IMonthlyBreakdownDetail[];
  };
  amc: {
    total: number;
    details: IMonthlyBreakdownDetail[];
  };
}

export const reportApi = createApi({
  reducerPath: "report",
  baseQuery: fetchBaseQuery({
    baseUrl: reportUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getAMCAnnualBreakDown: builder.query<
      IResponse<IAMCAnnualBreakDown[]>,
      IReportQueries
    >({
      query: ({ filter, options }) => ({
        url: `/amc-annual-breakdown?filter=${filter}&startDate=${options?.startDate}&endDate=${options?.endDate}&year=${options?.year}&quarter=${options?.quarter}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    // NEW QUERIES
    getTotalBillingReport: builder.query<
      IResponse<ITotalBillingReport[]>,
      IReportQueries
    >({
      query: ({ filter = "monthly", options }) => ({
        url: `/total-billing?filter=${filter}&startDate=${options?.startDate}&endDate=${options?.endDate}&year=${options?.year}&quarter=${options?.quarter}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    getExpectedVsReceivedRevenue: builder.query<
      IResponse<IExpectedVsReceivedRevenue[]>,
      IReportQueries
    >({
      query: ({ filter, options }) => ({
        url: `/expected-vs-received-revenue?filter=${filter}&startDate=${options?.startDate}&endDate=${options?.endDate}&year=${options?.year}&quarter=${options?.quarter}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    getIndustryWiseRevenueReport: builder.query<
      IResponse<IIndustryWiseRevenue[]>,
      IReportQueries
    >({
      query: ({ filter, options }) => ({
        url: `/industry-wise-revenue-distribution?filter=${filter}&startDate=${options?.startDate}&endDate=${options?.endDate}&year=${options?.year}&quarter=${options?.quarter}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    getProductWiseRevenueReport: builder.query<
      IResponse<IProductWiseRevenueReportResponse[]>,
      IReportQueries
    >({
      query: ({ filter, options }) => ({
        url: `/product-wise-revenue-distribution?filter=${filter}&startDate=${options?.startDate}&endDate=${options?.endDate}&year=${options?.year}&quarter=${options?.quarter}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    // NEW REVENUE DASHBOARD ENDPOINTS
    getRevenueDashboard: builder.query<
      IResponse<IRevenueDashboardResponse>,
      IReportQueries
    >({
      query: ({ filter = "monthly", options }) => {
        const params = new URLSearchParams();
        params.append("filter", filter);
        if (options?.year) params.append("year", options.year.toString());
        if (options?.quarter) params.append("quarter", options.quarter);
        if (options?.startDate) params.append("startDate", options.startDate.toString());
        if (options?.endDate) params.append("endDate", options.endDate.toString());
        return {
          url: `/revenue-dashboard?${params.toString()}`,
          method: HTTP_REQUEST.GET,
        };
      },
    }),
    getExpectedVsCollected: builder.query<
      IResponse<IExpectedVsCollectedResponse>,
      { fiscalYear: number }
    >({
      query: ({ fiscalYear }) => ({
        url: `/expected-vs-collected?fiscalYear=${fiscalYear}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    getMonthlyRevenueBreakdown: builder.query<
      IResponse<IMonthlyBreakdown>,
      { year: number; month: number }
    >({
      query: ({ year, month }) => ({
        url: `/monthly-revenue-breakdown?year=${year}&month=${month}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
  }),
});

export const {
  useGetProductWiseRevenueReportQuery,
  useGetAMCAnnualBreakDownQuery,
  useGetIndustryWiseRevenueReportQuery,
  useGetTotalBillingReportQuery,
  useGetExpectedVsReceivedRevenueQuery,
  useGetRevenueDashboardQuery,
  useGetExpectedVsCollectedQuery,
  useGetMonthlyRevenueBreakdownQuery,
} = reportApi;
