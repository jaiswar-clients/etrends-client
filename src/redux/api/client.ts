import { ClientDetailsInputs } from "@/types/client";
import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";
import { IProduct } from "@/types/product";
import { IOrderObject } from "./order";
import {
  IAdditionalServiceObject,
  IAMCObject,
  ICustomizationObject,
  ILicenceObject,
} from "@/types/order";

const authUrl = `${process.env.NEXT_PUBLIC_API_URL}/clients`;

export type IClientDataObject = Omit<ClientDetailsInputs, "parent_company"> & {
  _id: string;
  createdAt: string;
  orders: string[];
  parent_company: {
    id: string;
    name: string;
  };
  first_order_date: string;
};

export type IClientProfitOrderDetail = Omit<IOrderObject, "products"> & {
  products: IProduct[];
} & {
  amc_details: IAMCObject & { amc_percentage: number };
  licenses: ILicenceObject[];
  customizations: ICustomizationObject[];
  additional_services: IAdditionalServiceObject[];
};

export interface IClientProfit {
  total_profit: number;
  upcoming_amc_profit: number;
  total_amc_collection: number;
  balance: number;
  revenue_breakdown: {
    base_cost: number;
    customizations: number;
    licenses: number;
    additional_services: number;
    amc: number;
  };
  orders: IClientProfitOrderDetail[];
}

type IUpdateClientRequest = ClientDetailsInputs & { id: string };

export type GetAllClientResponse = Pick<
  IClientDataObject & { products: string[]; parent_company?: string; client_id?: string },
  | "name"
  | "_id"
  | "createdAt"
  | "client_id"
  | "industry"
  | "orders"
  | "products"
  | "first_order_date"
  | "parent_company"
>;

// Add new interfaces for filtering
export interface IClientFilterCompanyResponse {
  parents: IFilteredClient[];
  clients: IFilteredClient[];
}

export interface IFilteredClient {
  _id: string;
  name: string;
}

// Update the clients response to include pagination
export interface IGetClientsResponse {
  clients: GetAllClientResponse[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    pages: number;
  };
}

// Add new interface for query params
export interface IGetClientsQueryParams {
  page?: number;
  limit?: number;
  all?: boolean;
  parent_company_id?: string;
  client_name?: string;
  industry?: string;      // comma-separated
  product_id?: string;    // comma-separated
  startDate?: string;
  endDate?: string;
  has_orders?: string;
  status?: string;        // comma-separated: 'active', 'inactive', or 'active,inactive'
  financial_year?: string; // e.g. '2024'
}

export const clientApi = createApi({
  reducerPath: "client",
  baseQuery: fetchBaseQuery({
    baseUrl: authUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["CLIENT_DETAIL", "CLIENT_LIST", "PARENT_COMPANY_LIST"],
  endpoints: (builder) => ({
    getClientById: builder.query<IResponse<IClientDataObject>, string>({
      query: (id) => `/${id}`,
      providesTags: ["CLIENT_DETAIL"],
    }),
    getClients: builder.query<IResponse<IGetClientsResponse>, IGetClientsQueryParams>({
      query: (params) => {
        const { limit = 10, page = 1, all = false, ...rest } = params;
        const queryParams = new URLSearchParams();
        queryParams.append("limit", limit.toString());
        queryParams.append("page", page.toString());
        queryParams.append("all", all.toString());

        Object.entries(rest).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, String(value));
          }
        });

        return `/?${queryParams.toString()}`;
      },
      providesTags: ["CLIENT_LIST"],
    }),
    // Add new endpoint for client filters
    getClientFiltersOfCompany: builder.query<
      IResponse<IClientFilterCompanyResponse>,
      void
    >({
      query: () => ({
        url: "/filters/company-data",
        method: HTTP_REQUEST.GET,
      }),
    }),
    addClient: builder.mutation<IResponse, ClientDetailsInputs>({
      query: (body: ClientDetailsInputs) => ({
        url: "/",
        method: HTTP_REQUEST.POST,
        body,
      }),
      invalidatesTags: ["CLIENT_LIST"],
    }),
    updateClient: builder.mutation<IResponse, IUpdateClientRequest>({
      query: (body: IUpdateClientRequest) => ({
        url: `/${body.id}`,
        method: HTTP_REQUEST.PATCH,
        body,
      }),
      invalidatesTags: ["CLIENT_DETAIL", "CLIENT_LIST", "PARENT_COMPANY_LIST"],
    }),
    deleteClient: builder.mutation<IResponse, string>({
      query: (id: string) => ({
        url: `/${id}`,
        method: HTTP_REQUEST.DELETE,
      }),
      invalidatesTags: ["CLIENT_DETAIL", "CLIENT_LIST", "PARENT_COMPANY_LIST"],
    }),
    getPurchasedProductsByClient: builder.query<
      IResponse<
        (IProduct & {
          order_id: string;
          amc_rate: {
            percentage: number;
            amount: number;
          };
          total_cost: number;
          cost_per_license: number;
        })[]
      >,
      string
    >({
      query: (clientId) => `/${clientId}/products`,
    }),
    getAllParentCompanies: builder.query<
      IResponse<{ _id: string; name: string }[]>,
      void
    >({
      query: () => `/parent-companies`,
      providesTags: ["PARENT_COMPANY_LIST"],
    }),
    getProfitFromClient: builder.query<IResponse<IClientProfit>, string>({
      query: (clientId) => `/${clientId}/profit`,
    }),
    generateNewClientId: builder.query<IResponse, void>({
      query: () => ({
        url: "/generate-client-id",
      }),
    }),
    checkClientDuplicate: builder.query<
      IResponse<{
        exists: boolean;
        clients: Pick<IClientDataObject, "name" | "_id">[];
      }>,
      { name: string; product?: string; exclude_id?: string }
    >({
      query: ({ name, product, exclude_id }) => {
        const params = new URLSearchParams({ name });
        if (product) params.append("product", product);
        if (exclude_id) params.append("exclude_id", exclude_id);
        return { url: `/check-client-duplicate?${params.toString()}` };
      },
    }),
    exportClients: builder.mutation<void, {
      parent_company_id?: string;
      client_name?: string;
      industry?: string;
      product_id?: string;
      startDate?: string;
      endDate?: string;
      has_orders?: string;
      status?: string;
      financial_year?: string;
    }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        queryParams.append("all", "true");

        if (params.parent_company_id)
          queryParams.append("parent_company_id", params.parent_company_id);
        if (params.client_name) queryParams.append("client_name", params.client_name);
        if (params.industry) queryParams.append("industry", params.industry);
        if (params.product_id) queryParams.append("product_id", params.product_id);
        if (params.startDate) queryParams.append("startDate", params.startDate);
        if (params.endDate) queryParams.append("endDate", params.endDate);
        if (params.has_orders) queryParams.append("has_orders", params.has_orders);
        if (params.status) queryParams.append("status", params.status);
        if (params.financial_year) queryParams.append("financial_year", params.financial_year);

        return {
          url: `/export?${queryParams.toString()}`,
          method: HTTP_REQUEST.GET,
          responseHandler: (response) => response.blob(),
        };
      },
    }),
    getClientStats: builder.query<
      IResponse<{ active: number; inactive: number; total: number }>,
      Omit<IGetClientsQueryParams, "status" | "page" | "limit" | "all">
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, String(value));
          }
        });
        return `/stats?${queryParams.toString()}`;
      },
    }),
  }),
});

export const {
  useAddClientMutation,
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetClientsQuery,
  useGetClientFiltersOfCompanyQuery,
  useGetPurchasedProductsByClientQuery,
  useGetAllParentCompaniesQuery,
  useGetProfitFromClientQuery,
  useGenerateNewClientIdQuery,
  useCheckClientDuplicateQuery,
  useExportClientsMutation,
  useGetClientStatsQuery,
} = clientApi;
