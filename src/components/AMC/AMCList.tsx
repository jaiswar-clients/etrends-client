"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
  getSortedRowModel,
  getFilteredRowModel,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Eye, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "../ui/input";
import { TransformedAMCObject } from "@/redux/api/order";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector } from "@/redux/hook";
import { AMC_FILTER } from "./AMC";
import { formatCurrency } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { IOrderFilterCompanyResponse } from "@/types/order";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ExportDialog from "./ExportDialog";
import CreateAmcPaymentsDialog from "./CreateAmcPaymentsDialog";
import { useToast } from "@/hooks/use-toast";
import { RootState } from "@/redux/store";
import FinancialYearFilter, {
  generateFinancialYears,
} from "../common/FinancialYearFilter";

const financialYears = generateFinancialYears();

interface IProps {
  pagination: {
    total: number;
    limit: number;
    page: number;
    pages: number;
  };
  totalAmount: {
    paid: number | undefined;
    pending: number | undefined;
    proforma: number | undefined;
    invoice: number | undefined;
    total: number;
  };
  data: TransformedAMCObject[];
  changeFilter: (
    filters: string[],
    options?: { startDate?: string; endDate?: string }
  ) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  initialClientFilter?: string;
  initialProductFilter?: string;
  onClientFilterChange: (client: string | undefined) => void;
  onProductFilterChange: (product: string | undefined) => void;
  activeFilters: string[];
  dateRangeSelector: { show: boolean; startDate: Date; endDate: Date };
  isLoading?: boolean;
  selectedFY?: string;
  onFYFilterChange: (fy: string | undefined) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  companyData?: IOrderFilterCompanyResponse;
}

type TableData = {
  id: string;
  client: string;
  order: string;
  status: string;
  orderId: string;
  amount: string;
  amcObject: TransformedAMCObject; // Store the full AMC object
};

const AMCList: React.FC<IProps> = ({
  data,
  changeFilter,
  onPageChange,
  currentPage,
  pagination,
  totalAmount,
  initialClientFilter,
  initialProductFilter,
  onClientFilterChange,
  onProductFilterChange,
  activeFilters,
  dateRangeSelector,
  isLoading,
  selectedFY,
  onFYFilterChange,
  onCustomDateChange,
  companyData,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [clientSearch, setClientSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const products = useAppSelector((state) => state.user.products);
  const authToken = useAppSelector((state: RootState) => state.user.user.token);

  // Toggle row expansion
  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  // Filter payments based on current filters - matching backend logic exactly
  const getFilteredPayments = (payments: any[], filters: string[]) => {
    if (!payments || !Array.isArray(payments)) return [];

    // Process date filters - matching backend logic
    const startDate = dateRangeSelector.startDate
      ? new Date(dateRangeSelector.startDate)
      : null;
    const endDate = dateRangeSelector.endDate
      ? new Date(dateRangeSelector.endDate)
      : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const filteredResults = payments.filter((payment) => {
      // If no filters are selected, don't show any payments
      if (filters.length === 0) return false;

      // Check this specific payment against each of the user's selected filters
      let paymentMatchedAnyFilter = false;

      for (const filterType of filters) {
        const paymentFromDate = new Date(payment.from_date);
        const dateInRange =
          (!startDate || paymentFromDate >= startDate) &&
          (!endDate || paymentFromDate <= endDate);

        let currentFilterMatch = false;

        // Direct string comparison instead of enum comparison
        switch (filterType) {
          case "paid":
            currentFilterMatch =
              payment.status === "paid" &&
              ((!startDate && !endDate) || dateInRange);
            break;
          case "pending":
            currentFilterMatch =
              payment.status === "pending" &&
              ((!startDate && !endDate) || dateInRange);
            break;
          case "proforma":
            currentFilterMatch =
              payment.status === "proforma" &&
              ((!startDate && !endDate) || dateInRange);
            break;
          case "invoice":
            currentFilterMatch =
              payment.status === "invoice" &&
              ((!startDate && !endDate) || dateInRange);
            break;
        }

        if (currentFilterMatch) {
          paymentMatchedAnyFilter = true;
          break; // No need to check other filters for this payment
        }
      }

      return paymentMatchedAnyFilter;
    });

    return filteredResults;
  };

  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const tableData = useMemo(() => {
    const mappedData = data.map((d) => ({
      id: d._id,
      client: d.client.name,
      order: d.products.map((p) => p.short_name).join(", "),
      status: d.last_payment?.status || "",
      orderId: d.order?._id,
      amount: formatCurrency(d.amount),
      amcObject: d, // Store the full AMC object
    }));

    // Set all rows to be collapsed by default for better readability
    const defaultExpandedState: Record<string, boolean> = {};
    mappedData.forEach((row) => {
      defaultExpandedState[row.id] = false;
    });
    setExpandedRows(defaultExpandedState);

    return mappedData;
  }, [data]);

  const uniqueProducts = useMemo(
    () => [...new Set(products.map((product) => product.short_name))],
    [products]
  );

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!companyData?.clients) return [];
    return companyData.clients.filter((client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [companyData?.clients, clientSearch]);

  // Define columns with access to component state
  const columns = useMemo<ColumnDef<TableData>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => {
          const amcObject = row.original.amcObject;
          const payments = amcObject.payments || [];
          const filteredPayments = getFilteredPayments(payments, activeFilters);

          // Only show expand button if there are payments matching the filters
          if (filteredPayments.length === 0) return null;

          return (
            <Button
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion(row.original.id);
              }}
              className="h-8 w-8 p-0"
            >
              {expandedRows[row.original.id] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "client",
        header: "Client",
      },
      {
        accessorKey: "order",
        header: "Products",
      },
      {
        accessorKey: "amount",
        header: "Amount",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/amc/${row.original.orderId}`);
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>
          );
        },
      },
    ],
    [expandedRows, activeFilters, router, getFilteredPayments]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Effect to set initial filters from props
  useEffect(() => {
    if (initialClientFilter) {
      table.getColumn("client")?.setFilterValue(initialClientFilter);
    }
    if (initialProductFilter) {
      table.getColumn("order")?.setFilterValue(initialProductFilter);
    }
  }, [initialClientFilter, initialProductFilter, activeFilters, table]);

  const handleFilterChange = (filter: string, enabled: boolean) => {
    const updatedFilters = enabled
      ? [...activeFilters, filter]
      : activeFilters.filter((f) => f !== filter);

    // Ensure at least one filter is selected
    if (updatedFilters.length === 0) {
      updatedFilters.push(AMC_FILTER.PENDING);
    }

    // Maintain current date settings
    changeFilter(updatedFilters, {
      startDate: dateRangeSelector.startDate.toISOString(),
      endDate: dateRangeSelector.endDate.toISOString(),
    });
  };

  const handleClientSelection = (clientId: string | undefined) => {
    onClientFilterChange(clientId);
    setClientSearch(""); // Reset search after selection
  };

  // Handle Excel export
  const handleExportClick = () => {
    setShowExportDialog(true);
  };

  const handleExportConfirm = async () => {
    setIsDownloading(true);
    try {
      // Show a toast to indicate that the export is in progress
      toast({
        title: "Preparing export",
        description: "Generating Excel file with your AMC data...",
        variant: "default",
        duration: 3000, // Show briefly
      });

      // Construct query parameters
      const params = new URLSearchParams({
        filter: activeFilters.join(","),
      });
      if (dateRangeSelector.startDate) {
        params.append("startDate", dateRangeSelector.startDate.toISOString());
      }
      if (dateRangeSelector.endDate) {
        params.append("endDate", dateRangeSelector.endDate.toISOString());
      }
      if (initialClientFilter) {
        params.append("client_id", initialClientFilter);
      }
      if (initialProductFilter) {
        params.append("product_id", initialProductFilter);
      }

      const exportUrl = `${
        process.env.NEXT_PUBLIC_API_URL
      }/orders/export-amc?${params.toString()}`;

      // Perform direct fetch
      const response = await fetch(exportUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Handle the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const currentDate = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `AMC_Export_${currentDate}.xlsx`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowExportDialog(false);

      toast({
        title: "Export successful",
        description: "Your AMC data has been exported to Excel.",
        variant: "default",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description:
          "There was an error exporting the data. Please try again or check the console for details.",
        variant: "destructive",
      });
      setShowExportDialog(false);
    } finally {
      setIsDownloading(false);
    }
  };

  // Find client and product names for display
  const clientName = useMemo(() => {
    if (!initialClientFilter || !companyData?.clients) return undefined;
    const client = companyData.clients.find(
      (c) => c._id === initialClientFilter
    );
    return client?.name;
  }, [initialClientFilter, companyData?.clients]);

  const productName = useMemo(() => {
    if (!initialProductFilter) return undefined;
    return initialProductFilter;
  }, [initialProductFilter]);

  const selectedFinancialYear = useMemo(() => {
    if (!selectedFY) return undefined;
    const fy = financialYears.find((f) => f.id === selectedFY);
    return fy?.label;
  }, [selectedFY]);

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 2xl:!grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700">
              Total Amount
            </CardTitle>
            <CardDescription>All AMCs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-800">
              {formatCurrency(totalAmount.total)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700">Paid</CardTitle>
            <CardDescription>Completed payments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-800">
              {formatCurrency(totalAmount.paid || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-700">Pending</CardTitle>
            <CardDescription>Awaiting payment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-800">
              {formatCurrency(totalAmount.pending || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-700">Proforma</CardTitle>
            <CardDescription>Proforma invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-800">
              {formatCurrency(totalAmount.proforma || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-700">Invoice</CardTitle>
            <CardDescription>Invoiced amount</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-800">
              {formatCurrency(totalAmount.invoice || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold tracking-tight">AMC List</h1>

        <div className="flex items-center gap-2">
          <CreateAmcPaymentsDialog />

          <Button
            onClick={handleExportClick}
            className="bg-green-600 hover:bg-green-700 shadow-sm transition-all"
            disabled={isDownloading}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isDownloading ? "Preparing Excel..." : "Export to Excel"}
          </Button>
        </div>
      </div>

      {/* Active Filters Indicator - Business Clarity */}
      {(activeFilters.length > 0 ||
        initialClientFilter ||
        initialProductFilter ||
        selectedFY) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Active Filters:
          </h3>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                <button
                  onClick={() => handleFilterChange(filter, false)}
                  className="ml-1.5 h-3 w-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
                  aria-label={`Remove ${filter} filter`}
                >
                  ×
                </button>
              </span>
            ))}
            {selectedFY && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Financial Year: {selectedFinancialYear}
                <button
                  onClick={() => onFYFilterChange(undefined)}
                  className="ml-1.5 h-3 w-3 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center"
                  aria-label="Remove financial year filter"
                >
                  ×
                </button>
              </span>
            )}
            {initialClientFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {clientName}
                <button
                  onClick={() => handleClientSelection(undefined)}
                  className="ml-1.5 h-3 w-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center"
                  aria-label="Remove client filter"
                >
                  ×
                </button>
              </span>
            )}
            {initialProductFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {productName}
                <button
                  onClick={() => onProductFilterChange(undefined)}
                  className="ml-1.5 h-3 w-3 rounded-full bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center"
                  aria-label="Remove product filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between py-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* FY Filter with Custom Date Option */}
          <FinancialYearFilter
            selectedFY={selectedFY}
            onFYFilterChange={onFYFilterChange}
            onCustomDateChange={(startDate, endDate) => {
              onCustomDateChange(startDate, endDate);
            }}
            dateRange={{
              startDate: dateRangeSelector.startDate,
              endDate: dateRangeSelector.endDate,
            }}
            buttonLabel={
              selectedFY
                ? financialYears.find((fy) => fy.id === selectedFY)?.label ||
                  "All Years"
                : "All Years"
            }
          />

          {/* Client Filter Dropdown */}
          <div className="relative">
            {initialClientFilter ? (
              <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                <span className="text-sm font-medium">
                  {initialClientFilter}
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
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <DropdownMenuCheckboxItem
                          key={client._id}
                          className="capitalize"
                          checked={initialClientFilter === client.name}
                          onCheckedChange={(value) => {
                            handleClientSelection(
                              value ? client._id : undefined
                            );
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

          {/* Products Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {initialProductFilter || "Products"}{" "}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {uniqueProducts.map((product) => (
                <DropdownMenuCheckboxItem
                  key={product}
                  className="capitalize"
                  checked={initialProductFilter === product}
                  onCheckedChange={(value) => {
                    onProductFilterChange(value ? product : undefined);
                  }}
                >
                  {product}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AMC Type Filter - Multi-select */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                AMC Types <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.values(AMC_FILTER).map((filter) => (
                <DropdownMenuCheckboxItem
                  key={filter}
                  className="capitalize"
                  checked={activeFilters.includes(filter)}
                  onCheckedChange={(value) => {
                    handleFilterChange(filter, value);
                  }}
                >
                  {filter} AMC
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Client Search */}
        <Input
          placeholder="Filter clients..."
          value={(table.getColumn("client")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("client")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-gray-200"
              >
                {headerGroup.headers.map((header, index) => (
                  <TableHead
                    key={header.id}
                    className={`py-3 font-medium text-gray-700 text-sm ${
                      index === 0 ? "pl-6" : ""
                    } ${
                      index === headerGroup.headers.length - 1 ? "pr-6" : ""
                    }`}
                  >
                    {header.id === "expander" ? (
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const allExpanded = Object.values(
                              expandedRows
                            ).every((val) => val);
                            const newState: Record<string, boolean> = {};
                            tableData.forEach((row) => {
                              if (
                                row.amcObject.payments &&
                                getFilteredPayments(
                                  row.amcObject.payments || [],
                                  activeFilters
                                ).length > 0
                              ) {
                                newState[row.id] = !allExpanded;
                              }
                            });
                            setExpandedRows(newState);
                          }}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          {Object.values(expandedRows).some((val) => val) ? (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          )}
                        </Button>
                        <span className="ml-2 text-sm">All</span>
                      </div>
                    ) : header.isPlaceholder ? null : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : tableData.length > 0 ? (
              tableData.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow className="cursor-pointer hover:bg-blue-50 transition-colors duration-200 border-b border-gray-200">
                    <TableCell className="py-3">
                      {row.amcObject.payments &&
                        getFilteredPayments(
                          row.amcObject.payments || [],
                          activeFilters
                        ).length > 0 && (
                          <Button
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(row.id);
                            }}
                            className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors duration-200"
                          >
                            {expandedRows[row.id] ? (
                              <ChevronDown className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                            )}
                          </Button>
                        )}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center space-x-3">
                        <div className="font-semibold text-gray-900 text-sm">
                          {row.client}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="text-gray-700 text-sm">{row.order}</div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="font-semibold text-gray-900">
                        {row.amount}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/amc/${row.orderId}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded row for payments */}
                  {expandedRows[row.id] && (
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <TableCell colSpan={columns.length} className="p-0">
                        <div className="p-6 bg-white border-l-4 border-blue-500 ml-4 mr-4 mb-2 rounded-r-lg shadow-sm">
                          {/* Header Section */}
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                              <div>
                                <h4 className="text-base font-semibold text-gray-900">
                                  Payment History
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {row.client} • {row.order}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600">
                                {
                                  getFilteredPayments(
                                    row.amcObject.payments || [],
                                    activeFilters
                                  ).length
                                }
                                /{row.amcObject.payments?.length || 0}
                              </div>
                              <div className="text-base font-bold text-gray-900">
                                {row.amount}
                              </div>
                            </div>
                          </div>

                          {/* Payment Cards Grid */}
                          <div className="space-y-3">
                            {row.amcObject.payments &&
                              getFilteredPayments(
                                row.amcObject.payments || [],
                                activeFilters
                              ).map((payment, index) => {
                                // Determine which filters this payment matches
                                const matchingFilters = activeFilters.filter(
                                  (filter) => {
                                    const paymentFromDate = new Date(
                                      payment.from_date
                                    );
                                    const startDate =
                                      dateRangeSelector.startDate
                                        ? new Date(dateRangeSelector.startDate)
                                        : null;
                                    const endDate = dateRangeSelector.endDate
                                      ? new Date(dateRangeSelector.endDate)
                                      : null;
                                    if (startDate)
                                      startDate.setHours(0, 0, 0, 0);
                                    if (endDate)
                                      endDate.setHours(23, 59, 59, 999);

                                    const dateInRange =
                                      (!startDate ||
                                        paymentFromDate >= startDate) &&
                                      (!endDate || paymentFromDate <= endDate);

                                    return (
                                      payment.status === filter &&
                                      ((!startDate && !endDate) || dateInRange)
                                    );
                                  }
                                );

                                // Status styling
                                const getStatusStyle = (status: string) => {
                                  switch (status) {
                                    case "paid":
                                      return "bg-green-100 text-green-800 border-green-200";
                                    case "pending":
                                      return "bg-red-100 text-red-800 border-red-200";
                                    case "proforma":
                                      return "bg-yellow-100 text-yellow-800 border-yellow-200";
                                    case "invoice":
                                      return "bg-blue-100 text-blue-800 border-blue-200";
                                    default:
                                      return "bg-gray-100 text-gray-800 border-gray-200";
                                  }
                                };

                                const getStatusIcon = (status: string) => {
                                  switch (status) {
                                    case "paid":
                                      return "✓";
                                    case "pending":
                                      return "⏱";
                                    case "proforma":
                                      return "📋";
                                    case "invoice":
                                      return "📄";
                                    default:
                                      return "•";
                                  }
                                };

                                return (
                                  <div
                                    key={payment._id}
                                    className={`p-4 rounded-lg border-2 hover:shadow-md transition-all duration-200 ${getStatusStyle(
                                      payment.status
                                    )}`}
                                  >
                                    <div className="flex items-start justify-between">
                                      {/* Left Section - Payment Info */}
                                      <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                          <span className="text-base mr-2">
                                            {getStatusIcon(payment.status)}
                                          </span>
                                          <div className="flex items-center space-x-3">
                                            <span className="font-medium text-gray-900 text-sm">
                                              Payment #{index + 1}
                                            </span>
                                            <span
                                              className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                                                payment.status === "paid"
                                                  ? "bg-green-600 text-white"
                                                  : payment.status === "pending"
                                                  ? "bg-red-600 text-white"
                                                  : payment.status ===
                                                    "proforma"
                                                  ? "bg-yellow-600 text-white"
                                                  : payment.status === "invoice"
                                                  ? "bg-blue-600 text-white"
                                                  : "bg-gray-600 text-white"
                                              }`}
                                            >
                                              {payment.status}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                          <div>
                                            <span className="text-gray-600 font-medium">
                                              Period:
                                            </span>
                                            <div className="font-medium text-gray-900 text-sm">
                                              {formatDate(payment.from_date)} -{" "}
                                              {formatDate(payment.to_date)}
                                            </div>
                                          </div>

                                          <div>
                                            <span className="text-gray-600 font-medium">
                                              AMC Rate:
                                            </span>
                                            <div className="font-medium text-gray-900 text-sm">
                                              {payment.amc_rate_applied?.toFixed(
                                                2
                                              ) || 0}
                                              %
                                            </div>
                                          </div>

                                          <div>
                                            <span className="text-gray-600 font-medium">
                                              Invoice:
                                            </span>
                                            <div className="font-medium text-gray-900 text-sm">
                                              {payment.invoice_number ||
                                                "Not generated"}
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right Section - Amount & Status */}
                                      <div className="text-right ml-4">
                                        <div className="text-lg font-bold text-gray-900 mb-1">
                                          {formatCurrency(
                                            payment.amc_rate_amount
                                          )}
                                        </div>

                                        {matchingFilters.length > 0 && (
                                          <div className="flex flex-wrap gap-1 justify-end">
                                            {matchingFilters.map((filter) => (
                                              <span
                                                key={filter}
                                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white bg-opacity-80 text-gray-700 border"
                                              >
                                                {filter}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                            {(!row.amcObject.payments ||
                              getFilteredPayments(
                                row.amcObject.payments || [],
                                activeFilters
                              ).length === 0) && (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                                  <svg
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">
                                  No payments found
                                </h3>
                                <p className="text-gray-500">
                                  Try adjusting your filters.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="h-16 w-16 mb-4 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-600">
                      No AMCs found
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try adjusting your filters to see more results.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {currentPage > 1 ? (
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(currentPage - 1);
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

            {Array.from({ length: pagination.pages }).map((_, index) => {
              const pageNumber = index + 1;
              // Show first, last, current and pages around current
              if (
                pageNumber === 1 ||
                pageNumber === pagination.pages ||
                Math.abs(pageNumber - currentPage) <= 1
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(pageNumber);
                      }}
                      isActive={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              // Show ellipsis for skipped pages
              if (
                (pageNumber === 2 && currentPage > 3) ||
                (pageNumber === pagination.pages - 1 &&
                  currentPage < pagination.pages - 2)
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
              {currentPage < pagination.pages ? (
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(currentPage + 1);
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

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => {
          setShowExportDialog(false);
        }}
        onConfirm={handleExportConfirm}
        isLoading={isDownloading}
        filterInfo={{
          filters: activeFilters,
          dateRange: {
            startDate: dateRangeSelector.startDate,
            endDate: dateRangeSelector.endDate,
          },
          clientName,
          productName,
          financialYear: selectedFinancialYear,
        }}
      />
    </div>
  );
};

export default AMCList;
