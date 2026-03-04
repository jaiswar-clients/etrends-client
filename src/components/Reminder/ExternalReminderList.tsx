import React, { useMemo, useState } from "react"
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    flexRender,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { ChevronDown } from "lucide-react"
import ExternalReminderDetail from "./ExternalReminderDetail"
import { IReminderObject, IEmailTemplate } from "@/redux/api/reminder"

interface IProps {
    data: (IReminderObject & { email_template?: IEmailTemplate })[]
}

type IColumn = {
    id: string
    subject: string
    client: string
    template: string
    createdAt: string
    orderId: string
}

const columns: ColumnDef<IColumn>[] = [
    { accessorKey: "client", header: "Client Name" },
    { accessorKey: "subject", header: "Subject" },
    { accessorKey: "template", header: "Template" },
    { accessorKey: "createdAt", header: "Email Sent Date" },
]

const ExternalReminderList: React.FC<IProps> = ({ data }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [detailsModal, setDetailsModal] = useState({ show: false, id: "" })

    const tableData = useMemo(() => {
        return data.map((d) => ({
            id: d._id,
            client: d.client?.name || "",
            subject: d.subject,
            template: d.template,
            createdAt: new Date(d.createdAt ?? "").toLocaleDateString(),
            orderId: d.order?._id || "",
        }))
    }, [data])

    const uniqueTemplates = useMemo(
        () => Array.from(new Set(tableData.map((d) => d.template))),
        [tableData]
    )
    const uniqueClients = useMemo(
        () => Array.from(new Set(tableData.map((d) => d.client))),
        [tableData]
    )

    const table = useReactTable({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        state: { sorting, columnFilters },
    })

    return (
        <div>
            <div className="flex items-center justify-between py-4">
                <Input
                    placeholder="Filter external reminders..."
                    value={(table.getColumn("client")?.getFilterValue() as string) ?? ""}
                    onChange={(e) => table.getColumn("client")?.setFilterValue(e.target.value)}
                    className="max-w-sm"
                />
                <div className="flex items-center gap-4">
                    {/* Template Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {(table.getColumn("template")?.getFilterValue() as string) || "Template"}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueTemplates.map((t) => (
                                <DropdownMenuCheckboxItem
                                    key={t}
                                    className="capitalize"
                                    checked={table.getColumn("template")?.getFilterValue() === t}
                                    onCheckedChange={(value) => {
                                        table.getColumn("template")?.setFilterValue(value ? t : "")
                                    }}
                                >
                                    {t}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Client Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {(table.getColumn("client")?.getFilterValue() as string) || "Client"}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueClients.map((c) => (
                                <DropdownMenuCheckboxItem
                                    key={c}
                                    className="capitalize"
                                    checked={table.getColumn("client")?.getFilterValue() === c}
                                    onCheckedChange={(value) => {
                                        table.getColumn("client")?.setFilterValue(value ? c : "")
                                    }}
                                >
                                    {c}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onClick={() => setDetailsModal({ show: true, id: row.original.id })}
                                    className="cursor-pointer"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id}>{String(cell.getValue())}</td>
                                    ))}
                                    <td>
                                        <Button
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (row.original.orderId) {
                                                    window.open(`/orders/${row.original.orderId}`, "_blank")
                                                }
                                            }}
                                        >
                                            Go to Order
                                        </Button>
                                    </td>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <td colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No data found
                                </td>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Table Footer - Items Info & Pagination */}
            <div className="flex items-center justify-between py-4 border-t">
                {/* Items Count Display */}
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                        {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-{Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}
                    </span>
                    <span className="mx-2">of</span>
                    <span className="font-medium text-foreground">
                        {table.getFilteredRowModel().rows.length}
                    </span>
                    <span className="ml-1">items</span>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-4">
                    <div className="flex items-baseline gap-1 text-sm">
                        <span className="text-muted-foreground">Page</span>
                        <span className="font-medium">
                            {table.getState().pagination.pageIndex + 1}
                        </span>
                        <span className="text-muted-foreground">
                            of {table.getPageCount()}
                        </span>
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
            <Dialog
                open={detailsModal.show}
                onOpenChange={(value) => setDetailsModal({ show: value, id: "" })}
            >
                <DialogContent className="max-w-[90vw] w-full md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw]">
                    <DialogTitle></DialogTitle>
                    {detailsModal.show && detailsModal.id && (
                        <ExternalReminderDetail reminder={
                            data.find((d) => d._id === detailsModal.id) as IReminderObject
                        } />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ExternalReminderList