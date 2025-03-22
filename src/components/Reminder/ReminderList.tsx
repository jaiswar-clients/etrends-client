'use client'

import { IReminderObject } from '@/redux/api/reminder'
import React, { useMemo, useState } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    ColumnFiltersState,
    getSortedRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import ReminderDetail from './ReminderDetail'

interface IProps {
    data: IReminderObject[]
}

type IColumn = {
    id: string | undefined
    client: any
    type: string
    from: string
    createdAt: string
}

const columns: ColumnDef<IColumn>[] = [
    {
        accessorKey: 'client',
        header: 'Client',
    },
    {
        accessorKey: 'type',
        header: 'Reminder Type',
    },
    {
        accessorKey: 'from',
        header: 'Internal Team Email',
    },
    {
        accessorKey: 'createdAt',
        header: 'Date',
    },
]

const ReminderList: React.FC<IProps> = ({ data }) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [reminderModal, setReminderModal] = useState({ show: false, id: '' })

    const tableData = useMemo(() => {
        return data.map((d) => ({
            id: d._id,
            client: d.context.client,
            type: d.template,
            from: d.from,
            createdAt: new Date(d.createdAt ?? '').toLocaleDateString(),
        }))
    }, [data])

    // Extract unique reminder types and clients
    const uniqueReminderTypes = useMemo(
        () => Array.from(new Set(tableData.map((d) => d.type))),
        [tableData]
    )
    const uniqueClients = useMemo(
        () => Array.from(new Set(tableData.map((d) => d.client))),
        [tableData]
    )

    const table = useReactTable({
        data: tableData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    })

    return (
        <div>
            <div className="flex items-center justify-between py-4">
                <Input
                    placeholder="Filter reminders..."
                    value={(table.getColumn('client')?.getFilterValue() as string) ?? ''}
                    onChange={(event) =>
                        table.getColumn('client')?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <div className="flex items-center gap-4">
                    {/* Reminder Type Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {(table.getColumn('type')?.getFilterValue() as string) ?? 'Reminder Type'}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueReminderTypes.map((type) => (
                                <DropdownMenuCheckboxItem
                                    key={type}
                                    className="capitalize"
                                    checked={table.getColumn('type')?.getFilterValue() === type}
                                    onCheckedChange={(value) => {
                                        table.getColumn('type')?.setFilterValue(value ? type : '')
                                    }}
                                >
                                    {type}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Client Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {(table.getColumn('client')?.getFilterValue() as string) ?? 'Client'}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {uniqueClients.map((client) => (
                                <DropdownMenuCheckboxItem
                                    key={client}
                                    className="capitalize"
                                    checked={table.getColumn('client')?.getFilterValue() === client}
                                    onCheckedChange={(value) => {
                                        table.getColumn('client')?.setFilterValue(value ? client : '')
                                    }}
                                >
                                    {client}
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
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className='cursor-pointer' onClick={() => setReminderModal({ id: row.original.id || "", show: true })}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <Dialog open={reminderModal.show} onOpenChange={(value) => setReminderModal({ show: value, id: "" })}>
                <DialogContent className='max-w-[90vw] w-full md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw]'>
                    <DialogTitle> </DialogTitle>
                    {reminderModal.show && reminderModal.id && (
                        <ReminderDetail id={reminderModal.id} />
                    )}
                </DialogContent>
            </Dialog>

            {/* Add pagination controls */}
            <div className="flex items-center justify-between py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {table.getFilteredRowModel().rows.length} of {tableData.length} items
                </div>
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            {table.getCanPreviousPage() ? (
                                <PaginationPrevious 
                                    href="#" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        table.previousPage();
                                    }}
                                />
                            ) : (
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="opacity-50 cursor-not-allowed"
                                />
                            )}
                        </PaginationItem>
                        
                        {/* Calculate page numbers to display */}
                        {Array.from({ length: table.getPageCount() }).map((_, index) => {
                            // Show limited page numbers with ellipsis for better UX
                            const pageIndex = index;
                            const currentPage = table.getState().pagination.pageIndex;
                            
                            // Always show first, last, current and pages around current
                            if (
                                pageIndex === 0 || 
                                pageIndex === table.getPageCount() - 1 ||
                                Math.abs(pageIndex - currentPage) <= 1
                            ) {
                                return (
                                    <PaginationItem key={pageIndex}>
                                        <PaginationLink 
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                table.setPageIndex(pageIndex);
                                            }}
                                            isActive={currentPage === pageIndex}
                                        >
                                            {pageIndex + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            }
                            
                            // Show ellipsis for skipped pages
                            if (
                                (pageIndex === 1 && currentPage > 2) ||
                                (pageIndex === table.getPageCount() - 2 && currentPage < table.getPageCount() - 3)
                            ) {
                                return (
                                    <PaginationItem key={pageIndex}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                );
                            }
                            
                            return null;
                        })}
                        
                        <PaginationItem>
                            {table.getCanNextPage() ? (
                                <PaginationNext 
                                    href="#" 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        table.nextPage();
                                    }}
                                />
                            ) : (
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => e.preventDefault()}
                                    className="opacity-50 cursor-not-allowed"
                                />
                            )}
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
}

export default ReminderList