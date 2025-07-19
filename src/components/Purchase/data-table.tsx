"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Layers,
  Package2,
  FileText,
  Clock,
  Tag,
  FileType2,
  Box,
  Receipt,
  DollarSign,
  Plus,
  IndianRupee,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";
import {
  IPurchase,
  ILicenceObject,
  ICustomizationObject,
  IAdditionalServiceObject,
  PURCHASE_TYPE,
} from "@/types/order";
import { Separator } from "../ui/separator";
import { useRouter } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const router = useRouter();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => (row as any)._id || String(Math.random()), // Fallback to random ID if _id is not available
  });

  const toggleRow = (rowId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Function to format date
  const formatDate = (date?: Date | string) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      console.error(e);
      return "Invalid Date";
    }
  };

  // Function to render customizations
  const renderCustomizations = (
    customizations: ICustomizationObject[],
    clientId: string
  ) => {
    if (!customizations || customizations.length === 0) return null;

    return (
      <div className="pl-6 pt-3 pb-4">
        <div className="flex items-center mb-4">
          <Layers className="h-5 w-5 mr-2 text-indigo-500" />
          <h4 className="text-base font-medium text-indigo-600">
            Customizations
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customizations.map((customization) => (
            <div
              key={customization._id}
              className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(
                  `/purchases/${customization._id}?type=${PURCHASE_TYPE.CUSTOMIZATION}&client=${clientId}`
                )
              }
            >
              <div className="flex items-center mb-3">
                <FileType2 className="h-4 w-4 mr-2 text-indigo-500" />
                <span className="font-medium text-gray-800">
                  Type: <span className="capitalize">{customization.type}</span>
                </span>
              </div>
              <div className="flex justify-between mb-3">
                <div className="flex items-center text-sm">
                  <Package2 className="h-4 w-4 mr-2 text-gray-500" />
                  <span>PO: {customization.purchase_order_number}</span>
                </div>
                <div className="flex items-center text-sm font-medium text-green-600">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{formatCurrency(customization.cost)}</span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                <span>
                  Purchase Date: {formatDate(customization.purchased_date)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="mt-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Layers className="h-4 w-4 mr-2" />
                  <span>Modules:</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {customization.modules.map((module, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {module}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render license details
  const renderLicenses = (licenses: ILicenceObject[], clientId: string) => {
    if (!licenses || licenses.length === 0) return null;

    return (
      <div className="pl-6 pt-3 pb-4">
        <div className="flex items-center mb-4">
          <Tag className="h-5 w-5 mr-2 text-blue-500" />
          <h4 className="text-base font-medium text-blue-600">Licenses</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {licenses.map((license) => (
            <div
              key={license._id}
              className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(
                  `/purchases/${license._id}?type=${PURCHASE_TYPE.LICENSE}&client=${clientId}`
                )
              }
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <Box className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium text-gray-800">
                    License Details
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-600 border-blue-200 capitalize"
                >
                  {license.payment_status || "Pending"}
                </Badge>
              </div>
              <Separator className="my-2" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="flex items-center text-gray-500 mb-1">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    <span>Purchase Order</span>
                  </div>
                  <span className="font-medium">
                    {license.purchase_order_number}
                  </span>
                </div>
                <div>
                  <div className="flex items-center text-gray-500 mb-1">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    <span>Purchase Date</span>
                  </div>
                  <span className="font-medium">
                    {formatDate(license.purchase_date)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center text-gray-500 mb-1">
                    <Receipt className="h-3.5 w-3.5 mr-1.5" />
                    <span>Invoice</span>
                  </div>
                  <span className="font-medium">{license.invoice_number}</span>
                </div>
                <div>
                  <div className="flex items-center text-gray-500 mb-1">
                    <IndianRupee className="h-3.5 w-3.5 mr-1.5" />
                    <span>Amount</span>
                  </div>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      license.rate.amount * (license.total_license || 1)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render additional service details
  const renderAdditionalServices = (
    services: IAdditionalServiceObject[],
    clientId: string
  ) => {
    if (!services || services.length === 0) return null;

    return (
      <div className="pl-6 pt-3 pb-4">
        <div className="flex items-center mb-4">
          <Plus className="h-5 w-5 mr-2 text-emerald-500" />
          <h4 className="text-base font-medium text-emerald-600">
            Additional Services
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div
              key={service._id}
              className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(
                  `/purchases/${service._id}?type=${PURCHASE_TYPE.ADDITIONAL_SERVICE}&client=${clientId}`
                )
              }
            >
              <div className="flex items-center mb-3">
                <FileText className="h-4 w-4 mr-2 text-emerald-500" />
                <span className="font-medium text-gray-800">
                  {service.name}
                </span>
              </div>
              <div className="flex justify-between mb-3">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>Date: {formatDate(service.invoice_date)}</span>
                </div>
                <div className="flex items-center text-sm font-medium text-green-600">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{formatCurrency(service.cost)}</span>
                </div>
              </div>
              <div className="bg-emerald-50 p-2 rounded text-sm flex items-center mb-2">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                <span>
                  Service Period: {formatDate(service.date.start)} -{" "}
                  {formatDate(service.date.end)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to render all sub-items (customizations, licenses, additional services)
  const renderSubItems = (purchase: IPurchase) => {
    if (!purchase) return null;

    return (
      <div className="py-2">
        {renderCustomizations(
          purchase.customizations || [],
          purchase.client_id._id
        )}
        {renderLicenses(purchase.licenses || [], purchase.client_id._id)}
        {renderAdditionalServices(
          purchase.additional_services || [],
          purchase.client_id._id
        )}
      </div>
    );
  };

  // Prepare expanded state information outside the render function
  const expandedState = useMemo(() => {
    return table.getRowModel().rows.map((row) => ({
      id: row.id,
      isExpanded: expandedRows.has(row.id),
      purchase: row.original as IPurchase,
    }));
  }, [table.getRowModel().rows, expandedRows]);

  return (
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
          {expandedState.length ? (
            <>
              {expandedState.map((state) => (
                <React.Fragment key={state.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggleRow(state.id)}
                  >
                    {table
                      .getRowModel()
                      .rows.find((row) => row.id === state.id)
                      ?.getVisibleCells()
                      .map((cell) => (
                        <TableCell key={cell.id}>
                          {cell.column.id === "client_id.name" ? (
                            <div className="flex items-center">
                              {state.isExpanded ? (
                                <ChevronDown className="mr-2 h-4 w-4" />
                              ) : (
                                <ChevronRight className="mr-2 h-4 w-4" />
                              )}
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </div>
                          ) : (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          )}
                        </TableCell>
                      ))}
                  </TableRow>
                  {state.isExpanded && (
                    <TableRow
                      key={`${state.id}-expanded`}
                      className="bg-gray-50 hover:bg-gray-50"
                    >
                      <TableCell colSpan={columns.length} className="p-0">
                        {renderSubItems(state.purchase)}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </>
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
  );
}
