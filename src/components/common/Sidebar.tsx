"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
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
import { useAppSelector } from "@/redux/hook"
import { Bell, CircleDashed, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

// Menu items.
const items = [
    {
        title: "Clients",
        url: "clients",
        icon: MdOutlinePeopleAlt,
    },
    {
        title: "Purchases",
        url: "purchases",
        icon: MdAddShoppingCart,
    },
    {
        title: "AMC",
        url: "amc",
        icon: HiOutlineWrenchScrewdriver,
    },
    {
        title: "Pending Payments",
        url: "pending-payments",
        icon: CircleDashed,
    },
    {
        title: "Reminders",
        url: "reminders",
        icon: Bell,
    },
    {
        title: "Reports",
        url: "reports",
        icon: TbReportAnalytics,
    },
    {
        title: "AI Reports",
        url: "ai-reports",
        icon: Bot,
    },
    {
        title: "Products",
        url: "products",
        icon: GoPackage,
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const isAuthPage = pathname.startsWith("/auth")

    const { user } = useAppSelector(state => state.user)
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"

    if (isAuthPage) return null

    const isActive = (url: string) => {
        return pathname.startsWith(`/${url}`)
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <Image src="/images/logo.png" width={200} height={100} alt="logo" />
            </SidebarHeader>
            <SidebarContent className="md:mt-4 p-2">
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                className="[&>svg]:size-5 !data-[active=true]:bg-black[data-active=true] "
                                isActive={isActive(item.url)}
                                tooltip={item.title}
                            >
                                <Link href={`/${item.url}`} className="mb-2">
                                    <item.icon
                                        size={20}
                                        className={`text-3xl ${isActive(item.url) ? "text-white" : "text-black"
                                            }`}
                                    />
                                    <Typography
                                        variant="h4"
                                        className={`font-normal ${isActive(item.url) ? "text-white font-medium" : ""
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
                <div
                    className={cn(
                        "flex items-center gap-2 cursor-pointer rounded-md p-2 transition-all duration-200",
                        isCollapsed && "justify-center"
                    )}
                >
                    <Avatar className={cn("h-16 w-16 transition-all duration-200", isCollapsed && "h-10 w-10")}>
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <Typography variant="h3">{user.name}</Typography>
                            <Typography variant="p" className="text-xs">
                                {user.designation}
                            </Typography>
                        </div>
                    )}
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}