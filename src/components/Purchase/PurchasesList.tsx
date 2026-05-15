"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IPurchase, PURCHASE_TYPE } from "@/types/order";
import { ORDER_STATUS_ENUM } from "@/types/client";
import { useState, useMemo } from "react";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DataTable } from "./data-table";
import {
  useGetOrderFiltersOfCompanyQuery,
  useExportPurchasesToExcelMutation,
} from "@/redux/api/order";
import FinancialYearFilter from "../common/FinancialYearFilter";
import { FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/redux/hook";

const TYPE_OPTIONS = [
  { label: "New Order", value: "new" },
  { label: "AMC", value: "amc" },
  { label: "Customization", value: "customization" },
  { label: "Auditor License", value: "auditor_license" },
  { label: "Additional Service", value: "additional_service" },
];

const columns = (
  router: ReturnType<typeof useRouter>,
  pagination: { page: number; limit: number },
): ColumnDef<IPurchase>[] => [
  {
    id: "sr_no",
    header: "Sr. No.",
    cell: ({ row }) => {
      const serialNumber =
        (pagination.page - 1) * pagination.limit + row.index + 1;
      return serialNumber;
    },
  },
  {
    accessorKey: "client_id.name",
    header: "Client",
    cell: ({ row }) => row.original.client_id.name,
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => {
      const products = row.original.products
        .map((p) => p.short_name)
        .join(", ");
      return products;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const isCancelled = !!row.original.cancelled_at;
      return (
        <Badge
          variant={
            isCancelled
              ? "secondary"
              : status === ORDER_STATUS_ENUM.ACTIVE
                ? "success"
                : status === ORDER_STATUS_ENUM.INACTIVE
                  ? "destructive"
                  : "default"
          }
          className={isCancelled ? "bg-gray-300 text-gray-700" : ""}
        >
          {isCancelled ? "Cancelled" : status}
        </Badge>
      );
    },
  },
  {
    id: "badges",
    header: "Tags",
    cell: ({ row }) => {
      const purchase = row.original;
      const badges = [];
      if (purchase.has_customizations) {
        badges.push(
          <Badge key="customization" variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mr-1">
            Customization
          </Badge>
        );
      }
      if (purchase.has_licenses) {
        badges.push(
          <Badge key="license" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mr-1">
            License
          </Badge>
        );
      }
      if (purchase.has_amc) {
        badges.push(
          <Badge key="amc" variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-1">
            AMC
          </Badge>
        );
      }
      return <div className="flex flex-wrap gap-1">{badges}</div>;
    },
  },
  {
    accessorKey: "client_id.parent_company.name",
    header: "Parent Company",
    cell: ({ row }) => row.original.client_id.parent_company?.name || "N/A",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const purchase = row.original;
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click toggle
            router.push(
              `/purchases/${purchase._id}?type=${PURCHASE_TYPE.ORDER}&client=${purchase.client_id._id}`,
              { scroll: false }
            );
          }}
        >
          View
        </Button>
      );
    },
  },
];

interface IProps {
  data: IPurchase[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
  initialFilters: {
    client?: string;
    clientId?: string;
    products?: string[];
    productIds?: string[];
    status?: string;
    purchaseType?: string;
    parentCompany?: string;
    parentCompanyId?: string;
    amcPending: boolean;
    page: number;
    pageSize: number;
    fy?: string;
    startDate?: string;
    endDate?: string;
    types?: string[];
    includeCancelled?: boolean;
  };
  onFilterChange: (
    filterType:
      | "client"
      | "product"
      | "status"
      | "purchaseType"
      | "parentCompany"
      | "clientId"
      | "parentCompanyId"
      | "productIds",
    value: string | string[] | undefined,
  ) => void;
  onAmcPendingChange: (value: boolean) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onTypesChange: (types: string[]) => void;
  isLoading?: boolean;
  selectedFY?: string;
  onFYFilterChange: (fy: string | undefined) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

const PurchasesList: React.FC<IProps> = ({
  data,
  pagination,
  initialFilters,
  onFilterChange,
  onAmcPendingChange,
  onPageChange,
  onPageSizeChange,
  onTypesChange,
  isLoading,
  selectedFY,
  onFYFilterChange,
  onCustomDateChange,
  dateRange,
}) => {
  const products = useAppSelector((state) => state.user.products);

  const { data: filtersData } = useGetOrderFiltersOfCompanyQuery();
  const [clientSearch, setClientSearch] = useState("");
  const [parentSearch, setParentSearch] = useState("");
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const [exportPurchasesToExcel] = useExportPurchasesToExcelMutation();

  // Set active tab state from initialFilters
  const [activeTabFilters, setActiveTabFilters] = useState({
    pending_amc_start_date: initialFilters.amcPending,
  });

  const router = useRouter();

  // Get unique values for status filter
  const uniqueStatus = useMemo(
    () => Array.from(new Set(data.map((d) => d.status))),
    [data],
  );

  const uniqueProducts = useMemo(() => {
    const productMap = new Map();
    products.forEach((product: any) => {
      if (!productMap.has(product._id)) {
        productMap.set(product._id, product);
      }
    });
    return Array.from(productMap.values());
  }, [products]);

  const onTabFilterChange = (tab: keyof typeof activeTabFilters) => {
    const newValue = !activeTabFilters[tab];
    setActiveTabFilters((prev) => ({
      ...prev,
      [tab]: newValue,
    }));
    // Also call parent component callback
    if (tab === "pending_amc_start_date") {
      onAmcPendingChange(newValue);
    }
  };

  const handleClientSelection = (
    clientName: string | undefined,
    clientId: string | undefined,
  ) => {
    onFilterChange("client", clientName);
    onFilterChange("clientId", clientId);
    setClientSearch("");
  };

  const handleParentCompanySelection = (
    parentName: string | undefined,
    parentId: string | undefined,
  ) => {
    onFilterChange("parentCompany", parentName);
    onFilterChange("parentCompanyId", parentId);
    setParentSearch("");
  };

  const handleProductToggle = (productId: string, productName: string, checked: boolean) => {
    const currentIds = initialFilters.productIds || [];
    const currentNames = initialFilters.products || [];
    if (checked) {
      onFilterChange("productIds", [...currentIds, productId]);
      onFilterChange("product", [...currentNames, productName]);
    } else {
      onFilterChange("productIds", currentIds.filter((id) => id !== productId));
      onFilterChange("product", currentNames.filter((name) => name !== productName));
    }
  };

  const handleProductSelectAll = (checked: boolean) => {
    if (checked) {
      onFilterChange("productIds", uniqueProducts.map((p: any) => p._id));
      onFilterChange("product", uniqueProducts.map((p: any) => p.short_name));
    } else {
      onFilterChange("productIds", []);
      onFilterChange("product", []);
    }
  };

  const handleTypeToggle = (typeValue: string, checked: boolean) => {
    const current = initialFilters.types || [];
    if (checked) {
      onTypesChange([...current, typeValue]);
    } else {
      onTypesChange(current.filter((t) => t !== typeValue));
    }
  };

  const handleTypeSelectAll = (checked: boolean) => {
    onTypesChange(checked ? TYPE_OPTIONS.map((t) => t.value) : []);
  };

  const tableColumns = useMemo(
    () => columns(router, pagination),
    [router, pagination],
  );

  // Handle Excel export
  const handleExportClick = async () => {
    setIsExporting(true);
    try {
      toast({
        title: "Preparing export",
        description: "Generating Excel file with your purchases data...",
        variant: "default",
        duration: 3000,
      });

      const result = await exportPurchasesToExcel({
        parent_company_id: initialFilters.parentCompanyId,
        client_id: initialFilters.clientId,
        client_name: initialFilters.client,
        product_id: initialFilters.productIds?.join(",") || undefined,
        status: initialFilters.status as any,
        types: initialFilters.types?.join(",") || undefined,
        include_cancelled: initialFilters.includeCancelled,
        startDate: initialFilters.startDate,
        endDate: initialFilters.endDate,
      });

      if ("data" in result) {
        // Handle the download
        const blob = result.data as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        const currentDate = new Date().toISOString().split("T")[0];
        link.href = url;
        link.setAttribute("download", `Purchases_Export_${currentDate}.xlsx`);
        document.body.appendChild(link);
        link.click();

        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Export successful",
          description: "Your purchases data has been exported to Excel.",
          variant: "default",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Filter client and parent lists based on search
  const filteredClients = useMemo(() => {
    if (!filtersData?.data?.clients) return [];
    return filtersData.data.clients.filter((client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()),
    );
  }, [filtersData?.data?.clients, clientSearch]);

  const filteredParents = useMemo(() => {
    if (!filtersData?.data?.parents) return [];
    return filtersData.data.parents.filter((parent) =>
      parent.name.toLowerCase().includes(parentSearch.toLowerCase()),
    );
  }, [filtersData?.data?.parents, parentSearch]);

  // Helper to render selected products chip
  const selectedProductsLabel = useMemo(() => {
    const selectedIds = initialFilters.productIds || [];
    if (selectedIds.length === 0) return null;
    if (selectedIds.length <= 2) {
      return selectedIds
        .map((id) => uniqueProducts.find((p: any) => p._id === id)?.short_name || "")
        .filter(Boolean)
        .join(", ");
    }
    return `${selectedIds.length} selected`;
  }, [initialFilters.productIds, uniqueProducts]);

  // Helper to render selected types chip
  const selectedTypesLabel = useMemo(() => {
    const selected = initialFilters.types || [];
    if (selected.length === 0) return null;
    if (selected.length <= 2) {
      return selected
        .map((v) => TYPE_OPTIONS.find((t) => t.value === v)?.label || v)
        .join(", ");
    }
    return `${selected.length} selected`;
  }, [initialFilters.types]);

  const allProductsSelected =
    uniqueProducts.length > 0 &&
    uniqueProducts.length === (initialFilters.productIds || []).length;

  const allTypesSelected =
    TYPE_OPTIONS.length > 0 &&
    TYPE_OPTIONS.length === (initialFilters.types || []).length;

  return (
    <div>
      <div className="w-full">
        <div className="flex items-center justify-between py-4 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {/* Financial Year Filter */}
            <FinancialYearFilter
              selectedFY={selectedFY}
              onFYFilterChange={onFYFilterChange}
              onCustomDateChange={onCustomDateChange}
              dateRange={dateRange}
              buttonLabel="Financial Year"
            />

            {/* Client Filter */}
            <div className="relative">
              {initialFilters.client ? (
                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium">
                    {initialFilters.client}
                  </span>
                  <button
                    onClick={() => handleClientSelection(undefined, undefined)}
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
                <DropdownMenu open={clientDropdownOpen} onOpenChange={setClientDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="capitalize min-w-[120px]"
                    >
                      Client <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[250px]" onFocus={(e) => e.preventDefault()}>
                    <div className="px-2 py-2">
                      <Input
                        placeholder="Search clients..."
                        value={clientSearch}
                        onChange={(e) => {
                          e.stopPropagation();
                          setClientSearch(e.target.value);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="mb-2"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => (
                          <DropdownMenuCheckboxItem
                            key={client._id}
                            className="capitalize"
                            checked={initialFilters.clientId === client._id}
                            onCheckedChange={(value) => {
                              handleClientSelection(
                                value ? client.name : undefined,
                                value ? client._id : undefined,
                              );
                              setClientDropdownOpen(false);
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

            {/* Parent Company Filter */}
            <div className="relative">
              {initialFilters.parentCompany ? (
                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium">
                    {initialFilters.parentCompany}
                  </span>
                  <button
                    onClick={() =>
                      handleParentCompanySelection(undefined, undefined)
                    }
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
                <DropdownMenu open={parentDropdownOpen} onOpenChange={setParentDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="capitalize min-w-[120px]"
                    >
                      Parent <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[250px]" onFocus={(e) => e.preventDefault()}>
                    <div className="px-2 py-2">
                      <Input
                        placeholder="Search parent companies..."
                        value={parentSearch}
                        onChange={(e) => {
                          e.stopPropagation();
                          setParentSearch(e.target.value);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="mb-2"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredParents.length > 0 ? (
                        filteredParents.map((parent) => (
                          <DropdownMenuCheckboxItem
                            key={parent._id}
                            className="capitalize"
                            checked={
                              initialFilters.parentCompanyId === parent._id
                            }
                            onCheckedChange={(value) => {
                              handleParentCompanySelection(
                                value ? parent.name : undefined,
                                value ? parent._id : undefined,
                              );
                              setParentDropdownOpen(false);
                            }}
                          >
                            {parent.name}
                          </DropdownMenuCheckboxItem>
                        ))
                      ) : (
                        <div className="px-2 py-2 text-sm text-gray-500">
                          No parent companies found
                        </div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Filter */}
            <div className="relative">
              {initialFilters.status ? (
                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium capitalize">
                    {initialFilters.status}
                  </span>
                  <button
                    onClick={() => onFilterChange("status", undefined)}
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
                    <Button
                      variant="outline"
                      className="capitalize min-w-[120px]"
                    >
                      Status <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {uniqueStatus.map((status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        className="capitalize"
                        checked={initialFilters.status === status}
                        onCheckedChange={(value) => {
                          onFilterChange("status", value ? status : undefined);
                        }}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Products Filter */}
            <div className="relative">
              {selectedProductsLabel ? (
                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium">
                    {selectedProductsLabel}
                  </span>
                  <button
                    onClick={() => {
                      onFilterChange("productIds", []);
                      onFilterChange("product", []);
                    }}
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
                    <Button
                      variant="outline"
                      className="capitalize min-w-[120px]"
                    >
                      Products <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={allProductsSelected}
                      onCheckedChange={(value) => handleProductSelectAll(value)}
                    >
                      Select All
                    </DropdownMenuCheckboxItem>
                    {uniqueProducts.map((product: any) => (
                      <DropdownMenuCheckboxItem
                        key={product._id}
                        className="capitalize"
                        checked={initialFilters.productIds?.includes(product._id)}
                        onCheckedChange={(value) => {
                          handleProductToggle(product._id, product.short_name, value);
                        }}
                      >
                        {product.short_name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Order Type Filter */}
            <div className="relative">
              {selectedTypesLabel ? (
                <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                  <span className="text-sm font-medium">
                    {selectedTypesLabel}
                  </span>
                  <button
                    onClick={() => onTypesChange([])}
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
                    <Button
                      variant="outline"
                      className="capitalize min-w-[120px]"
                    >
                      Type <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={allTypesSelected}
                      onCheckedChange={(value) => handleTypeSelectAll(value)}
                    >
                      Select All
                    </DropdownMenuCheckboxItem>
                    {TYPE_OPTIONS.map((type) => (
                      <DropdownMenuCheckboxItem
                        key={type.value}
                        className="capitalize"
                        checked={initialFilters.types?.includes(type.value)}
                        onCheckedChange={(value) => {
                          handleTypeToggle(type.value, value);
                        }}
                      >
                        {type.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Status Filter */}
            <Select
              value={initialFilters.status || "all"}
              onValueChange={(value) =>
                onFilterChange("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-[130px] capitalize">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button
              onClick={handleExportClick}
              className="bg-green-600 hover:bg-green-700 shadow-sm transition-all"
              disabled={isExporting}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {isExporting ? "Preparing Excel..." : "Export to Excel"}
            </Button>
          </div>
        </div>
        <div className="flex mb-2">
          <Button
            className="rounded-full !py-1 h-auto"
            variant={
              activeTabFilters.pending_amc_start_date ? "secondary" : "outline"
            }
            size={"sm"}
            onClick={() => {
              onTabFilterChange("pending_amc_start_date");
            }}
          >
            <span className="text-xs">AMC Start Date Pending</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <DataTable columns={tableColumns} data={data} />
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between py-4 border-t">
          {/* Items Count Display + Page Size */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              <span className="font-medium text-foreground">
                {data.length > 0
                  ? `${Math.min((initialFilters.page - 1) * pagination.limit + 1, pagination.total)}-${Math.min(initialFilters.page * pagination.limit, pagination.total)}`
                  : "0-0"}
              </span>
              <span className="mx-2">of</span>
              <span className="font-medium text-foreground">
                {pagination.total}
              </span>
              <span className="ml-1">items</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select
                value={String(initialFilters.pageSize)}
                onValueChange={(value) => onPageSizeChange(parseInt(value))}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
          </div>

          {/* Pagination */}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (initialFilters.page > 1) {
                      onPageChange(initialFilters.page - 1);
                    }
                  }}
                  className={
                    initialFilters.page <= 1
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                />
              </PaginationItem>

              {/* Calculate page numbers to display */}
              {Array.from({
                length: Math.ceil(pagination.total / pagination.limit),
              }).map((_, index) => {
                const pageNumber = index + 1;
                const currentPage = initialFilters.page;

                // Always show first, last, current and pages around current
                if (
                  pageNumber === 1 ||
                  pageNumber ===
                    Math.ceil(pagination.total / pagination.limit) ||
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
                  (pageNumber ===
                    Math.ceil(pagination.total / pagination.limit) - 1 &&
                    currentPage <
                      Math.ceil(pagination.total / pagination.limit) - 2)
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
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (
                      initialFilters.page <
                      Math.ceil(pagination.total / pagination.limit)
                    ) {
                      onPageChange(initialFilters.page + 1);
                    }
                  }}
                  className={
                    initialFilters.page >=
                    Math.ceil(pagination.total / pagination.limit)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default PurchasesList;
