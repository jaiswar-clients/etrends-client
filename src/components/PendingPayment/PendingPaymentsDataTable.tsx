"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ExternalLink } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  IPendingPayment,
  IPendingPaymentPagination,
  IPendingPaymentType,
} from "@/types/order";
import { useLazyExportPendingPaymentsQuery } from "@/redux/api/order";

import { Input } from "../ui/input";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import FinancialYearFilter from "../common/FinancialYearFilter";
import { IFilteredClient } from "@/types/order";
import Link from "next/link";

interface IProps {
  data: IPendingPayment[];
  pagination: IPendingPaymentPagination;
  handlePagination: (page: number) => void;
  selectedFY?: string;
  onFYFilterChange: (fy: string | undefined) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  dateRange: {
    startDate?: Date;
    endDate?: Date;
  };
  clients: IFilteredClient[];
  selectedClientId?: string;
  onClientFilterChange: (clientId: string | undefined) => void;
  selectedType: IPendingPaymentType;
  onTypeFilterChange: (type: IPendingPaymentType) => void;
}

function getEntityLink(payment: IPendingPayment): string {
  switch (payment.type) {
    case "amc":
      return `/amc/${payment.order_id}`;
    case "license":
      return `/purchases/${payment._id}?type=license&client=${payment.client_id}`;
    case "customization":
      return `/purchases/${payment._id}?type=customization&client=${payment.client_id}`;
    case "order":
    default:
      return `/purchases/${payment.order_id}?type=order&client=${payment.client_id}`;
  }
}

export default function DataTableWithModalAndPagination({
  data,
  pagination,
  handlePagination,
  selectedFY,
  onFYFilterChange,
  onCustomDateChange,
  dateRange,
  clients,
  selectedClientId,
  onClientFilterChange,
  selectedType,
  onTypeFilterChange,
}: IProps) {
  const [triggerExport] = useLazyExportPendingPaymentsQuery();
  const [isExporting, setIsExporting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const formatDate = (dateInput?: string | Date | null) => {
    if (!dateInput) return "-";
    const date = new Date(dateInput);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const labelForType = (t: IPendingPaymentType) =>
    ({
      all: 'All Types',
      order: 'New Order',
      customization: 'Customization',
      license: 'Auditor Licences',
      amc: 'AMC',
    })[t] ?? t;

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()),
    );
  }, [clients, clientSearch]);

  const handleClientSelection = (clientId: string | undefined) => {
    onClientFilterChange(clientId);
    setClientSearch("");
  };

  const handleExportClick = async () => {
    setIsExporting(true);
    try {
      toast({
        title: "Preparing export",
        description: "Generating Excel file with pending payments...",
        variant: "default",
      });

      const result = await triggerExport({
        startDate: dateRange.startDate?.toISOString(),
        endDate: dateRange.endDate?.toISOString(),
        clientId: selectedClientId,
        type: selectedType,
      });

      if ("data" in result) {
        const blob = result.data as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        const currentDate = new Date().toISOString().split("T")[0];
        link.href = url;
        link.setAttribute(
          "download",
          `PendingPayments_Export_${currentDate}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Export successful",
          description: "Pending payments exported to Excel.",
          variant: "default",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "Could not generate Excel file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const renderFilters = () => (
    <div className="flex items-center justify-between py-4 flex-wrap gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <FinancialYearFilter
          selectedFY={selectedFY}
          onFYFilterChange={onFYFilterChange}
          onCustomDateChange={onCustomDateChange}
          dateRange={{
            startDate:
              dateRange.startDate ?? new Date(new Date().getFullYear(), 3, 1),
            endDate:
              dateRange.endDate ?? new Date(new Date().getFullYear(), 2, 31),
          }}
          buttonLabel="Financial Year"
        />

        <div className="relative">
          {selectedClientId &&
          clients.find((c) => c._id === selectedClientId) ? (
            <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
              <span className="text-sm font-medium">
                {clients.find((c) => c._id === selectedClientId)?.name}
              </span>
              <button
                onClick={() => handleClientSelection(undefined)}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Clients <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px]">
                <div className="px-2 py-2">
                  <Input
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="mb-2"
                  />
                  {clientSearch.length > 0 && clientSearch.length < 3 && (
                    <p className="text-xs text-muted-foreground">
                      Type at least 3 characters to search
                    </p>
                  )}
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <DropdownMenuCheckboxItem
                        key={client._id}
                        className="capitalize"
                        checked={selectedClientId === client._id}
                        onCheckedChange={(value) => {
                          handleClientSelection(value ? client._id : undefined);
                        }}
                      >
                        {client.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <div className="px-2 py-2 text-sm text-gray-500">
                      No clients found
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleExportClick}
          disabled={isExporting || data.length === 0}
        >
          {isExporting ? "Exporting..." : "Export"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto capitalize">
              {labelForType(selectedType)}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(
              ["all", "order", "customization", "license", "amc"] as IPendingPaymentType[]
            ).map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                className="capitalize"
                checked={selectedType === type}
                onCheckedChange={(checked) => {
                  if (checked) onTypeFilterChange(type);
                }}
              >
                {labelForType(type)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="container">
      {renderFilters()}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Invoice Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Pending Amount</TableHead>
              <TableHead className="w-[80px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((payment) => (
              <TableRow key={`${payment._id}-${payment.payment_identifier}`}>
                <TableCell className="font-mono text-xs">
                  {payment._id.slice(-6)}
                </TableCell>
                <TableCell>{labelForType(payment.type)}</TableCell>
                <TableCell>{payment.client_name}</TableCell>
                <TableCell>{payment.product_name}</TableCell>
                <TableCell>
                  {payment.invoice_number ? "Invoice" : "-"}
                </TableCell>
                <TableCell>
                  {formatDate(payment.invoice_date || payment.payment_date)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(payment.pending_amount)}
                </TableCell>
                <TableCell>
                  <Link href={getEntityLink(payment)}>
                    <Button variant="ghost" size="icon" title="View details">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          Showing {data.length} of {pagination.total} payments
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {pagination.currentPage > 1 ? (
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePagination(pagination.currentPage - 1);
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

            {Array.from({ length: pagination.totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === pagination.totalPages ||
                Math.abs(pageNumber - pagination.currentPage) <= 1
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePagination(pageNumber);
                      }}
                      isActive={pagination.currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              if (
                (pageNumber === 2 && pagination.currentPage > 3) ||
                (pageNumber === pagination.totalPages - 1 &&
                  pagination.currentPage < pagination.totalPages - 2)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return null;
            })}

            <PaginationItem>
              {pagination.currentPage < pagination.totalPages ? (
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePagination(pagination.currentPage + 1);
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
  );
}
