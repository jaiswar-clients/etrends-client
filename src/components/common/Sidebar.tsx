"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { MdAddShoppingCart, MdOutlinePeopleAlt } from "react-icons/md"
import { GoPackage } from "react-icons/go"
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2"
import { TbReportAnalytics } from "react-icons/tb"
import Typography from "../ui/Typography"
import Link from "next/link"
import Image from "next/image"
import { Avatar, AvatarImage } from "../ui/avatar"
import { AvatarFallback } from "@radix-ui/react-avatar"
import { usePathname } from "next/navigation"
import { useAppSelector, useAppStore } from "@/redux/hook"

// Menu items.
const items = [
    {
        title: "Clients",
        url: "clients",
        icon: MdOutlinePeopleAlt,
    },
    {
        title: "Products",
        url: "products",
        icon: GoPackage,
    },
    {
        title: "Purchases",
        url: "purchases",
        icon: MdAddShoppingCart,
    },
    {
        title: "AMC",
        url: "amcs",
        icon: HiOutlineWrenchScrewdriver,
    },
    {
        title: "Reports",
        url: "reports",
        icon: TbReportAnalytics,
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const isAuthPage = pathname.startsWith("/auth")

    const { user } = useAppSelector(state => state.user)

    if (isAuthPage) return null

    const isActive = (url: string) => {
        return pathname.startsWith(`/${url}`)
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <Image src="/images/logo.png" width={200} height={100} alt="logo" />
            </SidebarHeader>
            <SidebarContent className="md:mt-4 p-2">
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                className="[&>svg]:size-5"
                                isActive={isActive(item.url)}
                            >
                                <Link href={`/${item.url}`} className="mb-2">
                                    <item.icon
                                        size={20}
                                        className={`text-3xl ${isActive(item.url) ? "text-primary" : "text-black"
                                            }`}
                                    />
                                    <Typography
                                        variant="h4"
                                        className={`font-normal ${isActive(item.url) ? "text-primary font-medium" : ""
                                            }`}
                                    >
                                        {item.title}
                                    </Typography>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <div className="flex gap-2">
                    <Avatar className="w-16 h-16">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div className="">
                        <Typography variant="h3">{user.name}</Typography>
                        <Typography variant="p" className="text-xs">
                            {user.designation}
                        </Typography>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}