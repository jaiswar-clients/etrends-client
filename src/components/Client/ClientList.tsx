"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { GetAllClientResponse } from "@/redux/api/client";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hook";
import { DataTable } from "../ui/data-table";
import FinancialYearFilter from "../common/FinancialYearFilter";
import { useGetOrderFiltersOfCompanyQuery } from "@/redux/api/order";

interface IProps {
  data: GetAllClientResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  initialFilters: {
    client?: string;
    clientId?: string;
    products?: string[];
    productIds?: string[];
    industries?: string[];
    parentCompany?: string;
    parentCompanyId?: string;
    hasOrders: boolean;
    statuses?: ("active" | "inactive")[];
    page: number;
    pageSize: number;
    fy?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange: (
    filterType:
      | "client"
      | "product"
      | "industry"
      | "parentCompany"
      | "clientId"
      | "productId"
      | "parentCompanyId",
    value: string | string[] | undefined,
  ) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onStatusChange: (statuses: ("active" | "inactive")[]) => void;
  isLoading?: boolean;
  selectedFY?: string;
  onFYFilterChange: (fy: string | undefined) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  stats?: { active: number; inactive: number; total: number };
}

const columns = (
  router: ReturnType<typeof useRouter>,
  pageNumber: number,
  limit: number,
): ColumnDef<GetAllClientResponse>[] => [
  {
    id: "serial",
    header: "Sr. No.",
    cell: ({ row }) => {
      const serialNumber = (pageNumber - 1) * limit + row.index + 1;
      return <div className="text-center">{serialNumber}</div>;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "client_id",
    header: "Client ID",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.original.client_id || "-"}</div>
    ),
  },
  {
    accessorKey: "parent_company",
    header: "Parent Company",
    cell: ({ row }) => (
      <div className="capitalize">{row.original.parent_company || "-"}</div>
    ),
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("industry")}</div>
    ),
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => (
      <div className="">{row.original.products.join(", ")}</div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date Joined",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string);
      const formatted = date.toLocaleDateString();
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "first_order_date",
    header: "First Purchase",
    cell: ({ row }) => {
      const date = new Date(row.getValue("first_order_date") as string);
      const formatted = date.toLocaleDateString();
      return <div>{formatted}</div>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/clients/${client._id}`);
          }}
        >
          View
        </Button>
      );
    },
  },
];

const ClientList: React.FC<IProps> = ({
  data,
  pagination,
  initialFilters,
  onFilterChange,
  onPageChange,
  onPageSizeChange,
  onStatusChange,
  isLoading,
  selectedFY,
  onFYFilterChange,
  onCustomDateChange,
  dateRange,
  stats,
}) => {
  const products = useAppSelector((state) => state.user.products);
  const { data: filtersData } = useGetOrderFiltersOfCompanyQuery();
  const [clientSearch, setClientSearch] = useState("");
  const [parentSearch, setParentSearch] = useState("");

  const router = useRouter();

  // Get unique values for industry filters
  const uniqueIndustries = useMemo(
    () => Array.from(new Set(data.map((d) => d.industry))),
    [data],
  );

  const uniqueProducts = useMemo(() => {
    const productMap = new Map();
    products.forEach((product: any) => {
      if (!productMap.has(product.short_name)) {
        productMap.set(product.short_name, product);
      }
    });
    return Array.from(productMap.values());
  }, [products]);

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

  const handleIndustryToggle = (industry: string, checked: boolean) => {
    const current = initialFilters.industries || [];
    if (checked) {
      onFilterChange("industry", [...current, industry]);
    } else {
      onFilterChange("industry", current.filter((i) => i !== industry));
    }
  };

  const handleIndustrySelectAll = (checked: boolean) => {
    onFilterChange("industry", checked ? uniqueIndustries : []);
  };

  const handleProductToggle = (productId: string, productName: string, checked: boolean) => {
    const currentIds = initialFilters.productIds || [];
    const currentNames = initialFilters.products || [];
    if (checked) {
      onFilterChange("productId", [...currentIds, productId]);
      onFilterChange("product", [...currentNames, productName]);
    } else {
      onFilterChange("productId", currentIds.filter((id) => id !== productId));
      onFilterChange("product", currentNames.filter((name) => name !== productName));
    }
  };

  const handleProductSelectAll = (checked: boolean) => {
    if (checked) {
      onFilterChange("productId", uniqueProducts.map((p: any) => p._id));
      onFilterChange("product", uniqueProducts.map((p: any) => p.short_name));
    } else {
      onFilterChange("productId", []);
      onFilterChange("product", []);
    }
  };

  const handleStatusToggle = (status: "active" | "inactive", checked: boolean) => {
    const current = initialFilters.statuses || [];
    if (checked) {
      onStatusChange([...current, status]);
    } else {
      onStatusChange(current.filter((s) => s !== status));
    }
  };

  const handleStatusSelectAll = (checked: boolean) => {
    onStatusChange(checked ? ["active", "inactive"] : []);
  };

  const tableColumns = useMemo(
    () => columns(router, initialFilters.page, pagination.limit),
    [router, initialFilters.page, pagination.limit],
  );

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

  // Helper to render selected industries chip
  const selectedIndustriesLabel = useMemo(() => {
    const selected = initialFilters.industries || [];
    if (selected.length === 0) return null;
    if (selected.length <= 2) return selected.join(", ");
    return `${selected.length} selected`;
  }, [initialFilters.industries]);

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

  // Helper to render selected statuses chip
  const selectedStatusesLabel = useMemo(() => {
    const selected = initialFilters.statuses || [];
    if (selected.length === 0) return null;
    if (selected.length === 2) return "All";
    return selected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ");
  }, [initialFilters.statuses]);

  const allIndustriesSelected =
    uniqueIndustries.length > 0 &&
    uniqueIndustries.length === (initialFilters.industries || []).length;

  const allProductsSelected =
    uniqueProducts.length > 0 &&
    uniqueProducts.length === (initialFilters.productIds || []).length;

  const allStatusesSelected =
    (initialFilters.statuses || []).length === 2;

  return (
    <div className="w-full">
      {/* Stats Widget */}
      {stats && (
        <div className="flex gap-4 mb-4">
          <div className="px-4 py-2 bg-green-50 rounded-md">
            <span className="text-sm text-green-700 font-medium">Active: {stats.active}</span>
          </div>
          <div className="px-4 py-2 bg-gray-50 rounded-md">
            <span className="text-sm text-gray-700 font-medium">Inactive: {stats.inactive}</span>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-md">
            <span className="text-sm text-blue-700 font-medium">Total: {stats.total}</span>
          </div>
        </div>
      )}

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="capitalize min-w-[120px]"
                  >
                    Client <ChevronDown className="ml-2 h-4 w-4" />
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
                          checked={initialFilters.clientId === client._id}
                          onCheckedChange={(value) => {
                            handleClientSelection(
                              value ? client.name : undefined,
                              value ? client._id : undefined,
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="capitalize min-w-[120px]"
                  >
                    Parent <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[250px]">
                  <div className="px-2 py-2">
                    <Input
                      placeholder="Search parent companies..."
                      value={parentSearch}
                      onChange={(e) => setParentSearch(e.target.value)}
                      className="mb-2"
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
            {selectedStatusesLabel ? (
              <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                <span className="text-sm font-medium capitalize">
                  {selectedStatusesLabel}
                </span>
                <button
                  onClick={() => onStatusChange([])}
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
                  <DropdownMenuCheckboxItem
                    checked={allStatusesSelected}
                    onCheckedChange={(value) => handleStatusSelectAll(value)}
                  >
                    Select All
                  </DropdownMenuCheckboxItem>
                  {["active", "inactive"].map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      className="capitalize"
                      checked={initialFilters.statuses?.includes(status as "active" | "inactive")}
                      onCheckedChange={(value) => {
                        handleStatusToggle(status as "active" | "inactive", value);
                      }}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Industry Filter */}
          <div className="relative">
            {selectedIndustriesLabel ? (
              <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                <span className="text-sm font-medium capitalize">
                  {selectedIndustriesLabel}
                </span>
                <button
                  onClick={() => onFilterChange("industry", [])}
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
                    Industry <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuCheckboxItem
                    checked={allIndustriesSelected}
                    onCheckedChange={(value) => handleIndustrySelectAll(value)}
                  >
                    Select All
                  </DropdownMenuCheckboxItem>
                  {uniqueIndustries.map((industry) => (
                    <DropdownMenuCheckboxItem
                      key={industry}
                      className="capitalize"
                      checked={initialFilters.industries?.includes(industry)}
                      onCheckedChange={(value) => {
                        handleIndustryToggle(industry, value);
                      }}
                    >
                      {industry}
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
                    onFilterChange("productId", []);
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
        </div>
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
            {Array.from({ length: pagination.pages }).map((_, index) => {
              const pageNumber = index + 1;
              const currentPage = initialFilters.page;

              // Always show first, last, current and pages around current
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
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (initialFilters.page < pagination.pages) {
                    onPageChange(initialFilters.page + 1);
                  }
                }}
                className={
                  initialFilters.page >= pagination.pages
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default ClientList;
