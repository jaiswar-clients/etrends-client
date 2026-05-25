"use client"

import React, { useMemo, useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"
import { ChevronDown, FileSpreadsheet, Eye, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "../ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppSelector } from "@/redux/hook"
import { formatCurrency } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import FinancialYearFilter, { generateFinancialYears } from "../common/FinancialYearFilter"
import { useExportPendingPaymentsToExcelMutation } from "@/redux/api/order"
import { useRouter } from "next/navigation"

const financialYears = generateFinancialYears()

const TYPE_OPTIONS = [
  { label: "New Order", value: "new_order" },
  { label: "Customization", value: "customization" },
  { label: "Auditor Licences", value: "auditor_licence" },
  { label: "AMC", value: "amc" },
]

interface PendingPaymentRow {
  _id: string
  type: string
  type_sub?: string
  client_id: string
  client_name: string
  product_ids: string[]
  product_names: string[]
  order_id: string
  purchase_order_number?: string
  amount: number
  status: string
  invoice_date?: string
  invoice_number?: string
  entity_id: string
}

interface IFilteredClient {
  _id: string
  name: string
}

interface IOrderFilterCompanyResponse {
  parents: IFilteredClient[]
  clients: IFilteredClient[]
}

interface IProps {
  pagination: {
    total: number
    limit: number
    page: number
    pages: number
    hasNextPage?: boolean
    hasPreviousPage?: boolean
  }
  totalAmount: {
    total: number
    invoice: number
    pending: number
    new_order: number
    customization: number
    auditor_licence: number
    amc: number
  }
  data: PendingPaymentRow[]
  initialFilters: {
    client?: string
    clientId?: string
    products?: string[]
    productIds?: string[]
    types?: string[]
    page: number
    pageSize: number
    fy?: string
    startDate?: string
    endDate?: string
  }
  onClientFilterChange: (clientName: string | undefined, clientId: string | undefined) => void
  onProductFilterChange: (productNames: string[], productIds: string[]) => void
  onTypesChange: (types: string[]) => void
  onPageChange: (page: number) => void
  isLoading?: boolean
  selectedFY?: string
  onFYFilterChange: (fy: string | undefined) => void
  onCustomDateChange: (startDate: string, endDate: string) => void
  dateRange: { startDate: Date; endDate: Date }
  companyData?: IOrderFilterCompanyResponse
}

const formatDate = (dateString: string) => {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

const typeBadgeColors: Record<string, string> = {
  new_order: "bg-blue-100 text-blue-800 border-blue-200",
  customization: "bg-purple-100 text-purple-800 border-purple-200",
  auditor_licence: "bg-orange-100 text-orange-800 border-orange-200",
  amc: "bg-green-100 text-green-800 border-green-200",
}

const typeLabels: Record<string, string> = {
  new_order: "New Order",
  customization: "Customization",
  auditor_licence: "Auditor Licence",
  amc: "AMC",
}

const PendingPaymentsList: React.FC<IProps> = ({
  data,
  pagination,
  totalAmount,
  initialFilters,
  onClientFilterChange,
  onProductFilterChange,
  onTypesChange,
  onPageChange,
  isLoading,
  selectedFY,
  onFYFilterChange,
  onCustomDateChange,
  dateRange,
  companyData,
}) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [clientSearch, setClientSearch] = useState("")
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const products = useAppSelector((state) => state.user.products)
  const [exportPendingPaymentsToExcel] = useExportPendingPaymentsToExcelMutation()

  const uniqueProducts = useMemo(() => {
    const productMap = new Map()
    products.forEach((product: any) => {
      if (!productMap.has(product._id)) {
        productMap.set(product._id, product)
      }
    })
    return Array.from(productMap.values())
  }, [products])

  const filteredClients = useMemo(() => {
    if (!companyData?.clients) return []
    return companyData.clients.filter((client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()),
    )
  }, [companyData?.clients, clientSearch])

  const handleClientSelection = (clientName: string | undefined, clientId: string | undefined) => {
    onClientFilterChange(clientName, clientId)
    setClientSearch("")
  }

  const handleProductToggle = (productId: string, productName: string, checked: boolean) => {
    const currentIds = initialFilters.productIds || []
    const currentNames = initialFilters.products || []
    if (checked) {
      onProductFilterChange([...currentNames, productName], [...currentIds, productId])
    } else {
      onProductFilterChange(
        currentNames.filter((n) => n !== productName),
        currentIds.filter((id) => id !== productId),
      )
    }
  }

  const handleProductSelectAll = (checked: boolean) => {
    if (checked) {
      onProductFilterChange(
        uniqueProducts.map((p: any) => p.short_name),
        uniqueProducts.map((p: any) => p._id),
      )
    } else {
      onProductFilterChange([], [])
    }
  }

  const handleTypeToggle = (typeValue: string, checked: boolean) => {
    const current = initialFilters.types || []
    if (checked) {
      onTypesChange([...current, typeValue])
    } else {
      onTypesChange(current.filter((t) => t !== typeValue))
    }
  }

  const handleTypeSelectAll = (checked: boolean) => {
    onTypesChange(checked ? TYPE_OPTIONS.map((t) => t.value) : [])
  }

  const allProductsSelected =
    uniqueProducts.length > 0 && uniqueProducts.length === (initialFilters.productIds || []).length
  const allTypesSelected = TYPE_OPTIONS.length > 0 && TYPE_OPTIONS.length === (initialFilters.types || []).length

  const selectedProductsLabel = useMemo(() => {
    const selectedIds = initialFilters.productIds || []
    if (selectedIds.length === 0) return null
    if (selectedIds.length <= 2) {
      return selectedIds
        .map((id) => uniqueProducts.find((p: any) => p._id === id)?.short_name || "")
        .filter(Boolean)
        .join(", ")
    }
    return `${selectedIds.length} selected`
  }, [initialFilters.productIds, uniqueProducts])

  const selectedTypesLabel = useMemo(() => {
    const selected = initialFilters.types || []
    if (selected.length === 0) return null
    if (selected.length <= 2) {
      return selected.map((v) => TYPE_OPTIONS.find((t) => t.value === v)?.label || v).join(", ")
    }
    return `${selected.length} selected`
  }, [initialFilters.types])

  const handleExportClick = async () => {
    setIsExporting(true)
    try {
      toast({
        title: "Preparing export",
        description: "Generating Excel file with your pending payments data...",
        duration: 3000,
      })

      const result = await exportPendingPaymentsToExcel({
        startDate: initialFilters.startDate,
        endDate: initialFilters.endDate,
        client_id: initialFilters.clientId,
        product_id: initialFilters.productIds?.join(",") || undefined,
        type: initialFilters.types?.join(",") || undefined,
      })

      if ("data" in result) {
        const blob = result.data as Blob
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        const currentDate = new Date().toISOString().split("T")[0]
        link.href = url
        link.setAttribute("download", `Pending_Payments_Export_${currentDate}.xlsx`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Export successful",
          description: "Your pending payments data has been exported to Excel.",
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const columns = useMemo<ColumnDef<PendingPaymentRow>[]>(
    () => [
      {
        id: "sr_no",
        header: "Sr. No.",
        cell: ({ row }) => {
          return (initialFilters.page - 1) * initialFilters.pageSize + row.index + 1
        },
      },
      {
        accessorKey: "client_name",
        header: "Client",
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const rowType = row.original.type
          return (
            <Badge variant="outline" className={typeBadgeColors[rowType] || ""}>
              {typeLabels[rowType] || rowType}
            </Badge>
          )
        },
      },
      {
        id: "products",
        header: "Products",
        cell: ({ row }) => row.original.product_names?.join(", ") || "—",
      },
      {
        id: "invoice_number",
        header: "Invoice #",
        cell: ({ row }) => row.original.invoice_number || "—",
      },
      {
        id: "invoice_date",
        header: "Invoice Date",
        cell: ({ row }) => formatDate(row.original.invoice_date || ""),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        id: "scenario",
        header: "Scenario",
        cell: ({ row }) => {
          const isInvoice = row.original.status === "invoice"
          return (
            <Badge
              variant="outline"
              className={
                isInvoice
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-amber-100 text-amber-800 border-amber-200"
              }
            >
              {isInvoice ? "Invoice Raised" : "PO Balance"}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const item = row.original
          const navigateToPage = () => {
            if (item.type === "amc") {
              router.push(`/amc/${item.order_id}`)
            } else if (item.type === "new_order") {
              router.push(`/purchases/${item.order_id}?type=order&client=${item.client_id}`)
            } else if (item.type === "customization") {
              router.push(`/purchases/${item.order_id}`)
            } else if (item.type === "auditor_licence") {
              router.push(`/purchases/${item.order_id}`)
            } else {
              router.push(`/purchases/${item.order_id}`)
            }
          }
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigateToPage()
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          )
        },
      },
    ],
    [initialFilters.page, initialFilters.pageSize, router],
  )

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  })

  const selectedFinancialYear = useMemo(() => {
    if (!selectedFY) return undefined
    const fy = financialYears.find((f) => f.id === selectedFY)
    return fy?.label
  }, [selectedFY])

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700">Total Pending</CardTitle>
            <CardDescription>All outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalAmount.total)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-700">Invoice Raised</CardTitle>
            <CardDescription>Scenario 2</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-800">{formatCurrency(totalAmount.invoice)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-700">PO Balance</CardTitle>
            <CardDescription>Scenario 3</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-800">{formatCurrency(totalAmount.pending)}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700">New Orders</CardTitle>
            <CardDescription>Subtotal</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(totalAmount.new_order)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Pending Payments</h1>

        <Button
          onClick={handleExportClick}
          className="bg-green-600 hover:bg-green-700 shadow-sm transition-all"
          disabled={isExporting}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {isExporting ? "Preparing Excel..." : "Export to Excel"}
        </Button>
      </div>

      {/* Active Filters Indicator */}
      {(selectedFY || initialFilters.client || initialFilters.productIds?.length || initialFilters.types?.length) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Active Filters:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedFY && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {selectedFinancialYear}
                <button
                  onClick={() => onFYFilterChange(undefined)}
                  className="ml-1.5 h-3 w-3 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            {initialFilters.client && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {initialFilters.client}
                <button
                  onClick={() => handleClientSelection(undefined, undefined)}
                  className="ml-1.5 h-3 w-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            {selectedProductsLabel && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                {selectedProductsLabel}
                <button
                  onClick={() => onProductFilterChange([], [])}
                  className="ml-1.5 h-3 w-3 rounded-full bg-orange-600 text-white hover:bg-orange-700 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            {selectedTypesLabel && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {selectedTypesLabel}
                <button
                  onClick={() => onTypesChange([])}
                  className="ml-1.5 h-3 w-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center"
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
                <span className="text-sm font-medium">{initialFilters.client}</span>
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
                  <Button variant="outline" className="capitalize min-w-[120px]">
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
                            )
                            setClientDropdownOpen(false)
                          }}
                        >
                          {client.name}
                        </DropdownMenuCheckboxItem>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-sm text-gray-500">No clients found</div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Products Filter */}
          <div className="relative">
            {selectedProductsLabel ? (
              <div className="flex items-center space-x-1 h-10 px-4 py-2 bg-gray-100 rounded-md">
                <span className="text-sm font-medium">{selectedProductsLabel}</span>
                <button
                  onClick={() => onProductFilterChange([], [])}
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
                  <Button variant="outline" className="capitalize min-w-[120px]">
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
                        handleProductToggle(product._id, product.short_name, value)
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
                <span className="text-sm font-medium">{selectedTypesLabel}</span>
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
                  <Button variant="outline" className="capitalize min-w-[120px]">
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
                  {TYPE_OPTIONS.map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t.value}
                      className="capitalize"
                      checked={initialFilters.types?.includes(t.value)}
                      onCheckedChange={(value) => {
                        handleTypeToggle(t.value, value)
                      }}
                    >
                      {t.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-gray-200">
                {headerGroup.headers.map((header, index) => (
                  <TableHead
                    key={header.id}
                    className={`py-3 font-medium text-gray-700 text-sm ${index === 0 ? "pl-6" : ""} ${index === headerGroup.headers.length - 1 ? "pr-6" : ""}`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer hover:bg-blue-50 transition-colors duration-200 border-b border-gray-200">
                  {row.getVisibleCells().map((cell, index) => (
                    <TableCell key={cell.id} className={`py-3 ${index === 0 ? "pl-6" : ""} ${index === row.getVisibleCells().length - 1 ? "pr-6" : ""}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-6">
                    <Clock className="h-12 w-12 mb-3 text-gray-400" />
                    <p className="text-lg font-medium text-gray-600">No pending payments found</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-4 border-t">
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          <span className="font-medium text-foreground">
            {data.length > 0
              ? `${Math.min((initialFilters.page - 1) * initialFilters.pageSize + 1, pagination.total)}-${Math.min(initialFilters.page * initialFilters.pageSize, pagination.total)}`
              : "0-0"}
          </span>
          <span className="mx-2">of</span>
          <span className="font-medium text-foreground">{pagination.total}</span>
          <span className="ml-1">items</span>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {initialFilters.page > 1 ? (
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(initialFilters.page - 1)
                  }}
                />
              ) : (
                <PaginationPrevious href="#" onClick={(e) => e.preventDefault()} className="opacity-50 cursor-not-allowed" />
              )}
            </PaginationItem>

            {Array.from({ length: pagination.pages }).map((_, index) => {
              const pageNumber = index + 1
              if (
                pageNumber === 1 ||
                pageNumber === pagination.pages ||
                Math.abs(pageNumber - initialFilters.page) <= 1
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        onPageChange(pageNumber)
                      }}
                      isActive={initialFilters.page === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              if (
                (pageNumber === 2 && initialFilters.page > 3) ||
                (pageNumber === pagination.pages - 1 && initialFilters.page < pagination.pages - 2)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              return null
            })}

            <PaginationItem>
              {initialFilters.page < pagination.pages ? (
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(initialFilters.page + 1)
                  }}
                />
              ) : (
                <PaginationNext href="#" onClick={(e) => e.preventDefault()} className="opacity-50 cursor-not-allowed" />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}

export default PendingPaymentsList
