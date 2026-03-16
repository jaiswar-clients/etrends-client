"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onExport?: () => void;
  className?: string;
}

export function DrillDownTable<TData, TValue>({
  columns,
  data,
  onExport,
  className,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={className || "space-y-4"}>
      {onExport && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Default columns for aggregated data
export const getAggregatedDataColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "period",
    header: "Period",
    cell: ({ row }) => <div className="font-medium">{row.getValue("period")}</div>,
  },
  {
    accessorKey: "revenue",
    header: "Total Revenue",
    cell: ({ row }) => <div>{formatCurrency(Number(row.getValue("revenue") || 0))}</div>,
  },
  {
    accessorKey: "orderRevenue",
    header: "Order Revenue",
    cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(Number(row.getValue("orderRevenue") || 0))}</div>,
  },
  {
    accessorKey: "amcRevenue",
    header: "AMC Revenue",
    cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(Number(row.getValue("amcRevenue") || 0))}</div>,
  },
  {
    accessorKey: "customizationRevenue",
    header: "Customization Revenue",
    cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(Number(row.getValue("customizationRevenue") || 0))}</div>,
  },
  {
    accessorKey: "licenseRevenue",
    header: "License Revenue",
    cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(Number(row.getValue("licenseRevenue") || 0))}</div>,
  },
  {
    accessorKey: "serviceRevenue",
    header: "Service Revenue",
    cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(Number(row.getValue("serviceRevenue") || 0))}</div>,
  },
];

// Default columns for transaction details
export const getTransactionDetailColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const dateValue = row.getValue("date");
      return <div>{new Date(dateValue as string).toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const typeLabels: Record<string, string> = {
        order: "Order",
        amc: "AMC",
        customization: "Customization",
        license: "License",
        service: "Service",
      };
      return <div className="capitalize">{typeLabels[type] || type}</div>;
    },
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => <div className="font-medium">{row.getValue("client")}</div>,
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => <div>{row.getValue("product") || "-"}</div>,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <div className="font-medium">{formatCurrency(Number(row.getValue("amount") || 0))}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusColors: Record<string, string> = {
        paid: "bg-green-100 text-green-800",
        pending: "bg-yellow-100 text-yellow-800",
        proforma: "bg-blue-100 text-blue-800",
        invoice: "bg-purple-100 text-purple-800",
      };
      const colorClass = statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => <div>{row.getValue("industry") || "-"}</div>,
  },
];

// Export to CSV helper
export const exportToCSV = <T,>(data: T[], filename: string): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0] as Record<string, unknown>);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = (row as Record<string, unknown>)[header];
        if (typeof value === "object" && value !== null) {
          return JSON.stringify(value);
        }
        return String(value || "");
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};
