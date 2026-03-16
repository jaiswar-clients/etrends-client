import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";

const reportUrl = `${process.env.NEXT_PUBLIC_API_URL}/reports`;

export type IReportFilters = "monthly" | "quarterly" | "yearly" | "all";

// Dashboard Response Types
export interface DashboardSummary {
  totalRevenue: number;
  amcRevenue: number;
  newBusinessRevenue: number;
  customizationRevenue: number;
  licenseRevenue: number;
  additionalServiceRevenue: number;
  pendingPayments: number;
  paidPayments: number;
  totalClients: number;
  totalOrders: number;
  revenueGrowth: number;
  period: string;
}

export interface BillingTrend {
  period: string;
  newBusiness: number;
  amc: number;
}

export interface ExpectedReceivedTrend {
  period: string;
  expected: number;
  received: number;
}

export interface AMCBreakdownTrend {
  period: string;
  expected: number;
  collected: number;
}

export interface DashboardTrends {
  totalBilling: BillingTrend[];
  expectedVsReceived: ExpectedReceivedTrend[];
  amcBreakdown: AMCBreakdownTrend[];
}

export interface ProductWiseDistribution {
  productId: string;
  productName: string;
  revenue: number;
  percentage: number;
}

export interface IndustryWiseDistribution {
  industry: string;
  revenue: number;
  percentage: number;
}

export interface ClientWiseDistribution {
  clientId: string;
  clientName: string;
  revenue: number;
}

export interface DashboardDistributions {
  productWise: ProductWiseDistribution[];
  industryWise: IndustryWiseDistribution[];
  clientWise: ClientWiseDistribution[];
}

export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  revenue: number;
}

export interface TopIndustry {
  industry: string;
  revenue: number;
}

export interface TopPerformers {
  topProducts: TopProduct[];
  topClients: TopClient[];
  topIndustries: TopIndustry[];
}

export interface DashboardResponse {
  summary: DashboardSummary;
  trends: DashboardTrends;
  distributions: DashboardDistributions;
  topPerformers: TopPerformers;
}

export interface DashboardFiltersQuery {
  filter: string;
  fiscalYear?: number;
  quarter?: string;
  startDate?: string;
  endDate?: string;
  clientIds?: string[];
  productIds?: string[];
  industries?: string[];
  revenueStreams?: string[];
  paymentStatuses?: string[];
}

export interface FilterOptions {
  fiscalYears: { value: string; label: string }[];
  quarters: { value: string; label: string }[];
  clients: { value: string; label: string }[];
  products: { value: string; label: string }[];
  industries: { value: string; label: string }[];
  revenueStreams: { value: string; label: string }[];
  paymentStatuses: { value: string; label: string }[];
}

// Drill-Down Types
export interface DrillDownFiltersQuery extends DashboardFiltersQuery {
  drilldownType: 'product' | 'client' | 'time';
  drilldownValue?: string;
  aggregation?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  includeDetails?: boolean;
  page?: number;
  limit?: number;
}

export interface DrillDownMetadata {
  drilldownType: string;
  drilldownValue?: string;
  period: string;
  totalRecords: number;
}

export interface AggregatedDataRow {
  period: string;
  revenue: number;
  orderRevenue: number;
  amcRevenue: number;
  customizationRevenue: number;
  licenseRevenue: number;
  serviceRevenue: number;
}

export interface TransactionDetail {
  id: string;
  type: 'order' | 'amc' | 'customization' | 'license' | 'service';
  date: Date;
  client: string;
  product?: string;
  amount: number;
  status: string;
  industry?: string;
}

export interface DrillDownResponse {
  metadata: DrillDownMetadata;
  aggregatedData: AggregatedDataRow[];
  details?: TransactionDetail[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

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
  }),
});

export const {
  useGetProductWiseRevenueReportQuery,
  useGetAMCAnnualBreakDownQuery,
  useGetIndustryWiseRevenueReportQuery,
  useGetTotalBillingReportQuery,
  useGetExpectedVsReceivedRevenueQuery,
} = reportApi;

const dashboardUrl = `${process.env.NEXT_PUBLIC_API_URL}/dashboard`;

export const dashboardApi = createApi({
  reducerPath: "dashboard",
  baseQuery: fetchBaseQuery({
    baseUrl: dashboardUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getDashboard: builder.query<
      IResponse<DashboardResponse>,
      DashboardFiltersQuery
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v));
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
        return {
          url: `?${queryParams.toString()}`,
          method: HTTP_REQUEST.GET,
        };
      },
    }),
    getFilterOptions: builder.query<
      IResponse<FilterOptions>,
      void
    >({
      query: () => ({
        url: '/filter-options',
        method: HTTP_REQUEST.GET,
      }),
    }),
    getDrillDown: builder.query<
      IResponse<DrillDownResponse>,
      DrillDownFiltersQuery
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v));
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
        return {
          url: `/drilldown?${queryParams.toString()}`,
          method: HTTP_REQUEST.GET,
        };
      },
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetFilterOptionsQuery,
  useGetDrillDownQuery,
} = dashboardApi;
