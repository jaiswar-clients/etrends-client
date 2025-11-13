"use client";
import { AppSidebar } from "@/components/common/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useGetAllProductsQuery } from "@/redux/api/product";
import React, { useEffect } from "react";
import { setProducts } from "@/redux/slices/user";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { useRouter } from "next/navigation";

const LayoutWithQuery = ({ children }: Readonly<{
  children: React.ReactNode;
}>) => {
  const { data, isSuccess } = useGetAllProductsQuery();
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(state => state.user)
  const router = useRouter()

  // set data once data is fetched
  useEffect(() => {
    if (data && isSuccess) {
      dispatch(setProducts(data.data));
    }
  }, [data])

  useEffect(() => {
    if (!user?.token) {
      router.push('/auth/login')
    }
  }, [user, router])

  if(!user?.token) return null

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarTrigger />
      <main className="md:p-6 p-2 mt-5 w-full">{children}</main>
    </SidebarProvider>
  );
};

export default LayoutWithQuery;
