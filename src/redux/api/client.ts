import { ClientDetailsInputs } from "@/types/client";
import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";
import { IProduct } from "@/types/product";
import { IOrderObject } from "./order";

const authUrl = `${process.env.NEXT_PUBLIC_API_URL}/clients`;

export type IClientDataObject = Omit<ClientDetailsInputs, "parent_company"> & {
  _id: string;
  createdAt: string;
  orders: string[];
  parent_company: {
    id: string;
    name: string;
  };
};

type IUpdateClientRequest = ClientDetailsInputs & { id: string };

export type GetAllClientResponse = Pick<
  IClientDataObject & { products: string[] },
  "name" | "_id" | "createdAt" | "industry" | "orders" | "products"
>;

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
      IResponse<GetAllClientResponse[]>,
      { limit?: number; page?: number; all?: boolean }
    >({
      query: ({ limit = 10, page = 1, all = false } = {}) =>
        `/?limit=${limit}&page=${page}&all=${all}`,
      providesTags: ["CLIENT_LIST"],
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
      query: (id) => `/parent-companies`,
      providesTags: ["PARENT_COMPANY_LIST"],
    }),
    getProfitFromClient: builder.query<
      IResponse<{
        total_profit: number;
        upcoming_amc_profit: number;
        total_amc_collection: number;
        orders: (Omit<IOrderObject, "products"> & { products: IProduct[] })[];
      }>,
      string
    >({
      query: (clientId) => `/${clientId}/profit`,
    }),
  }),
});

export const {
  useAddClientMutation,
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useGetClientsQuery,
  useGetPurchasedProductsByClientQuery,
  useGetAllParentCompaniesQuery,
  useGetProfitFromClientQuery,
} = clientApi;
