import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";

const reportUrl = `${process.env.NEXT_PUBLIC_API_URL}/reports`;

export type IReportFilters = "monthly" | "quarterly" | "half-yearly" | "yearly" | "all";

export interface IReportQueries {
  filter: IReportFilters;
  options?: {
    startDate?: Date;
    endDate?: Date;
    year?: number;
    quarter?: string;
    orderTypes?: string;
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

/**
 * @deprecated Use getClientHealthDashboard instead
 */
export interface IAMCAnnualBreakDown {
  period: string;
  totalExpected: number;
  totalCollected: number;
}

/**
 * @deprecated Use getClientHealthDashboard instead
 */
export interface IIndustryWiseRevenue {
  industry: string;
  period: string;
  total: number;
  [key: string]: any;
}

/**
 * @deprecated Use getRevenueDashboard instead
 */
export interface IProductWiseRevenueReportResponse {
  productId: string;
  productName: string;
  revenue: number;
  percentage: number;
  cumulativePercentage: number;
}

/**
 * @deprecated Use getRevenueDashboard instead
 */
export interface ITotalBillingReport {
  period: string;
  total_amc_billing: number;
  total_purchase_billing: number;
}

/**
 * @deprecated Use getExpectedVsCollected instead
 */
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

// Cumulative amounts: collected <= invoiced <= expected.
// expected  = to_be_created + proforma + invoice + paid
// invoiced  = invoice + paid
// collected = paid
export interface ICollectionTotals {
  expected: number;
  invoiced: number;
  collected: number;
}

export interface IPeriodBreakdown extends ICollectionTotals {
  period: string;
}

export interface IExpectedVsCollectedResponse {
  fiscalYear: string;
  newSales: ICollectionTotals & { breakdown: IPeriodBreakdown[] };
  amc: ICollectionTotals & { breakdown: IPeriodBreakdown[] };
  total: ICollectionTotals;
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

// ==================== CLIENT HEALTH & RETENTION DASHBOARD TYPES ====================

export interface IClientHealthMetrics {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  activePercentage: number;
  overdueClients: {
    over30Days: number;
    over60Days: number;
    over90Days: number;
  };
  amcRenewalRate: number;
}

export interface IClientRevenueData {
  clientId: string;
  clientName: string;
  industry: string;
  totalRevenue: number;
  newSalesRevenue: number;
  amcRevenue: number;
  orderCount: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  isAtRisk: boolean;
  riskFactors: string[];
}

export interface ITopPerformersResponse {
  topClients: IClientRevenueData[];
  atRiskClients: IClientRevenueData[];
}

export interface IIndustryBreakdown {
  industry: string;
  clientCount: number;
  totalRevenue: number;
  percentage: number;
}

export interface IClientConcentrationRisk {
  totalRevenue: number;
  top10ClientsRevenue: number;
  top10Percentage: number;
  herfindahlIndex: number;
  riskLevel: 'low' | 'medium' | 'high';
  industryDiversification: IIndustryBreakdown[];
}

export interface IClientHealthDashboardResponse {
  healthMetrics: IClientHealthMetrics;
  topPerformers: ITopPerformersResponse;
  concentrationRisk: IClientConcentrationRisk;
  fiscalYear: string;
}

// ==================== DASHBOARD DRILL-DOWN ====================

export type DrilldownCard =
  | "total-revenue"
  | "new-sales"
  | "amc-revenue"
  | "revenue-split"
  | "revenue-trend"
  | "collection-rate"
  | "sales-collection"
  | "amc-collection"
  | "expected-vs-collected"
  | "client-health"
  | "client-performance"
  | "concentration-risk"
  | "expected-revenue"
  | "proforma"
  | "to-be-created";

export interface IDrilldownColumn {
  key: string;
  label: string;
  type: "text" | "currency" | "date" | "status" | "number" | "percent";
}

/** Where a drill-down row navigates to (server sets it as row._ref). */
export interface IRowRef {
  kind: "order" | "customization" | "license" | "additional_service" | "amc" | "client";
  /** order / item id; for "amc" the linked order id (AMC page is keyed by order). */
  id: string;
  clientId?: string;
}

/** App route for a drill-down row, or null when it has no detail page. */
export const drilldownRowHref = (ref?: IRowRef | null): string | null => {
  if (!ref?.id) return null;
  const client = ref.clientId ? `&client=${ref.clientId}` : "";
  switch (ref.kind) {
    case "amc":
      return `/amc/${ref.id}`;
    case "client":
      return `/clients/${ref.id}`;
    case "order":
    case "customization":
    case "license":
    case "additional_service":
      return `/purchases/${ref.id}?type=${ref.kind}${client}`;
    default:
      return null;
  }
};

export interface IDrilldownResponse {
  card: DrilldownCard;
  title: string;
  subtitle?: string;
  columns: IDrilldownColumn[];
  rows: Record<string, any>[];
  /** Columns offered as filter chips (e.g. ["category", "status"]). */
  filterKeys?: string[];
  /** Column whose values get subtotals (e.g. "category" -> New Order / AMC). */
  subtotalKey?: string;
}

export interface IStreamTotals {
  newSales: number;
  amc: number;
  total: number;
}

/** Expected = invoiced (Total Revenue) + proforma + toBeCreated. */
export interface IRevenuePipelineSummary {
  fiscalYear: string;
  invoiced: IStreamTotals;
  proforma: IStreamTotals;
  toBeCreated: IStreamTotals;
  expected: IStreamTotals;
}

export interface IDrilldownArgs {
  card: DrilldownCard;
  fiscalYear: number;
  filter?: string;
  orderTypes?: string;
  period?: string;
}

/** Query string shared by the drill-down table and its Excel export. */
export const buildDrilldownParams = (
  args: IDrilldownArgs & { filters?: Record<string, string[]>; search?: string }
) => {
  const params = new URLSearchParams();
  params.append("card", args.card);
  params.append("fiscalYear", args.fiscalYear.toString());
  if (args.filter) params.append("filter", args.filter);
  if (args.orderTypes) params.append("orderTypes", args.orderTypes);
  if (args.period) params.append("period", args.period);
  const filters = Object.fromEntries(
    Object.entries(args.filters ?? {}).filter(([, values]) => values.length > 0)
  );
  if (Object.keys(filters).length) params.append("filters", JSON.stringify(filters));
  if (args.search?.trim()) params.append("search", args.search.trim());
  return params;
};

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
    /**
     * @deprecated Use getClientHealthDashboard instead
     */
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
    /**
     * @deprecated Use getRevenueDashboard instead
     */
    getTotalBillingReport: builder.query<
      IResponse<ITotalBillingReport[]>,
      IReportQueries
    >({
      query: ({ filter = "monthly", options }) => ({
        url: `/total-billing?filter=${filter}&startDate=${options?.startDate}&endDate=${options?.endDate}&year=${options?.year}&quarter=${options?.quarter}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    /**
     * @deprecated Use getExpectedVsCollected instead
     */
    getExpectedVsReceivedRevenue: builder.query<
      IResponse<IExpectedVsReceivedRevenue[]>,
      IReportQueries
    >({
      query: ({ filter, options }) => ({
        url: `/expected-vs-received-revenue?filter=${filter}&startDate=${options?.startDate}&endDate=${options?.endDate}&year=${options?.year}&quarter=${options?.quarter}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    /**
     * @deprecated Use getClientHealthDashboard instead
     */
    getIndustryWiseRevenueReport: builder.query<
      IResponse<IIndustryWiseRevenue[]>,
      IReportQueries
    >({
      query: ({ filter, options }) => ({
        url: `/industry-wise-revenue-distribution?filter=${filter}&startDate=${options?.startDate}&endDate=${options?.endDate}&year=${options?.year}&quarter=${options?.quarter}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    /**
     * @deprecated Use getRevenueDashboard instead
     */
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
        if (options?.orderTypes) params.append("orderTypes", options.orderTypes);
        return {
          url: `/revenue-dashboard?${params.toString()}`,
          method: HTTP_REQUEST.GET,
        };
      },
    }),
    getExpectedVsCollected: builder.query<
      IResponse<IExpectedVsCollectedResponse>,
      { fiscalYear: number; filter?: IReportFilters; orderTypes?: string }
    >({
      query: ({ fiscalYear, filter = 'monthly', orderTypes }) => ({
        url: `/expected-vs-collected?fiscalYear=${fiscalYear}&filter=${filter}${orderTypes ? `&orderTypes=${orderTypes}` : ''}`,
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
    getRevenuePipeline: builder.query<
      IResponse<IRevenuePipelineSummary>,
      { fiscalYear: number; orderTypes?: string }
    >({
      query: ({ fiscalYear, orderTypes }) => ({
        url: `/revenue-pipeline?fiscalYear=${fiscalYear}${orderTypes ? `&orderTypes=${orderTypes}` : ""}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    getDashboardDrilldown: builder.query<IResponse<IDrilldownResponse>, IDrilldownArgs>({
      query: (args) => ({
        url: `/drilldown?${buildDrilldownParams(args).toString()}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
    // CLIENT HEALTH & RETENTION DASHBOARD
    getClientHealthDashboard: builder.query<
      IResponse<IClientHealthDashboardResponse>,
      { fiscalYear: number }
    >({
      query: ({ fiscalYear }) => ({
        url: `/client-health-dashboard?fiscalYear=${fiscalYear}`,
        method: HTTP_REQUEST.GET,
      }),
    }),
  }),
});

export const {
  useGetProductWiseRevenueReportQuery: useGetProductWiseRevenueReportQueryDeprecated,
  useGetAMCAnnualBreakDownQuery: useGetAMCAnnualBreakDownQueryDeprecated,
  useGetIndustryWiseRevenueReportQuery: useGetIndustryWiseRevenueReportQueryDeprecated,
  useGetTotalBillingReportQuery: useGetTotalBillingReportQueryDeprecated,
  useGetExpectedVsReceivedRevenueQuery: useGetExpectedVsReceivedRevenueQueryDeprecated,
  useGetRevenueDashboardQuery,
  useGetExpectedVsCollectedQuery,
  useGetMonthlyRevenueBreakdownQuery,
  useGetClientHealthDashboardQuery,
  useGetDashboardDrilldownQuery,
  useGetRevenuePipelineQuery,
} = reportApi;

// Backward compatibility aliases (deprecated)
export const useGetProductWiseRevenueReportQuery = useGetProductWiseRevenueReportQueryDeprecated;
export const useGetAMCAnnualBreakDownQuery = useGetAMCAnnualBreakDownQueryDeprecated;
export const useGetIndustryWiseRevenueReportQuery = useGetIndustryWiseRevenueReportQueryDeprecated;
export const useGetTotalBillingReportQuery = useGetTotalBillingReportQueryDeprecated;
export const useGetExpectedVsReceivedRevenueQuery = useGetExpectedVsReceivedRevenueQueryDeprecated;
