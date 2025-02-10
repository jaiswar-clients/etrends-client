import { HTTP_REQUEST } from "@/contants/request";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { IResponse } from "./auth";
import { RootState } from "../store";

const appUrl = `${process.env.NEXT_PUBLIC_API_URL}`;

export const appApi = createApi({
  reducerPath: "app",
  baseQuery: fetchBaseQuery({
    baseUrl: appUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).user.user.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    uploadFile: builder.mutation<IResponse, { file: File; filename: string }>({
      query: ({ file, filename }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", filename);

        return {
          url: `/upload`,
          method: HTTP_REQUEST.POST,
          body: formData,
        };
      },
    }),
    getInternalTeamEmail: builder.query<
      IResponse<{ name: string; email: string }[]>,
      void
    >({
      query: () => ({
        url: `/users/internal-team-emails`,
        method: HTTP_REQUEST.GET,
      }),
    }),
  }),
});

export const { useUploadFileMutation, useGetInternalTeamEmailQuery } = appApi;
