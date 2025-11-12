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
  IClientDataObject & { products: string[]; parent_company?: string },
  | "name"
  | "_id"
  | "createdAt"
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
    getClients: builder.query<
      IResponse<IGetClientsResponse>,
      {
        page?: number;
        limit?: number;
        all?: boolean;
        parent_company_id?: string;
        client_name?: string;
        industry?: string;
        product_id?: string;
        startDate?: string;
        endDate?: string;
        has_orders?: string;
      }
    >({
      query: (params) => {
        const {
          limit = 10,
          page = 1,
          all = false,
          parent_company_id,
          client_name,
          industry,
          product_id,
          startDate,
          endDate,
          has_orders,
        } = params;

        const queryParams = new URLSearchParams();
        queryParams.append("limit", limit.toString());
        queryParams.append("page", page.toString());
        queryParams.append("all", all.toString());

        if (parent_company_id)
          queryParams.append("parent_company_id", parent_company_id);
        if (client_name) queryParams.append("client_name", client_name);
        if (industry) queryParams.append("industry", industry);
        if (product_id) queryParams.append("product_id", product_id);
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);
        if (has_orders) queryParams.append("has_orders", has_orders);

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
    checkClientName: builder.query<
      IResponse<{
        exists: boolean;
        clients: Pick<IClientDataObject, "name" | "_id">[];
      }>,
      string
    >({
      query: (name) => ({
        url: `/check-client-name?name=${name}`,
      }),
    }),
    exportClients: builder.mutation<void, {
      parent_company_id?: string;
      client_name?: string;
      industry?: string;
      product_id?: string;
      startDate?: string;
      endDate?: string;
      has_orders?: string;
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

        return {
          url: `/export?${queryParams.toString()}`,
          method: HTTP_REQUEST.GET,
          responseHandler: (response) => response.blob(),
        };
      },
    }),
  }),
});

export const {
  useAddClientMutation,
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useGetClientsQuery,
  useGetClientFiltersOfCompanyQuery,
  useGetPurchasedProductsByClientQuery,
  useGetAllParentCompaniesQuery,
  useGetProfitFromClientQuery,
  useGenerateNewClientIdQuery,
  useCheckClientNameQuery,
  useExportClientsMutation
} = clientApi;
