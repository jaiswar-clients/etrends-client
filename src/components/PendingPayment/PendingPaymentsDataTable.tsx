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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
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
  IUpdatePendingPaymentRequest,
  PAYMENT_STATUS_ENUM,
} from "@/types/order";
import {
  useLazyExportPendingPaymentsQuery,
  useUpdatePendingPaymentMutation,
} from "@/redux/api/order";

import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import DatePicker from "../ui/datepicker";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatePayment, setUpdatePayment] = useState<{
    modal: boolean;
    data: IUpdatePendingPaymentRequest;
  }>({
    modal: false,
    data: {
      payment_identifier: "",
      status: "",
      payment_receive_date: new Date(),
      type: "order" as IPendingPaymentType,
      _id: "",
    },
  });

  const [updatePendingPaymentApi, { isLoading }] =
    useUpdatePendingPaymentMutation();
  const [triggerExport] = useLazyExportPendingPaymentsQuery();
  const [isExporting, setIsExporting] = useState(false);

  const form = useForm<{
    payment_receive_date: Date;
    status: PAYMENT_STATUS_ENUM;
  }>({
    defaultValues: {
      payment_receive_date: undefined,
      status: PAYMENT_STATUS_ENUM.PAID,
    },
  });

  const { handleSubmit } = form;

  const [selectedItem, setSelectedItem] = useState<IPendingPayment | null>(
    null,
  );
  const [clientSearch, setClientSearch] = useState("");

  const handleRowClick: (item: IPendingPayment) => void = (item) => {
    const payment_identifier =
      item.type === "order" || item.type === "amc"
        ? item.payment_identifier
        : item._id;
    setSelectedItem({ ...item, payment_identifier });
    setIsModalOpen(true);
  };

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

  const onSubmit = async (data: {
    payment_receive_date: Date;
    status: PAYMENT_STATUS_ENUM;
  }) => {
    if (!data.payment_receive_date) {
      toast({
        title: "Payment Receive Date is required",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }
    try {
      await updatePendingPaymentApi({
        payment_identifier: updatePayment?.data.payment_identifier ?? "",
        status: PAYMENT_STATUS_ENUM.PAID,
        payment_receive_date: data.payment_receive_date,
        type: updatePayment.data.type as IPendingPaymentType,
        _id: updatePayment.data._id,
      }).unwrap();
      toast({
        title: "Payment Updated",
        description: "Payment has been successfully updated",
        variant: "success",
      });
      setUpdatePayment({ modal: false, data: updatePayment.data });
      setIsModalOpen(false);
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "An error occurred while updating the payment",
        variant: "destructive",
      });
    }
  };

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
        {/* Financial Year Filter */}
        <FinancialYearFilter
          selectedFY={selectedFY}
          onFYFilterChange={onFYFilterChange}
          onCustomDateChange={onCustomDateChange}
          dateRange={{
            startDate:
              dateRange.startDate ?? new Date(new Date().getFullYear(), 3, 1), // set to april 1st of the year
            endDate:
              dateRange.endDate ?? new Date(new Date().getFullYear(), 2, 31), // set to march 31st of the year
          }}
          buttonLabel="Financial Year"
        />

        {/* Client Filter Dropdown */}
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
        {/* Type Filter Dropdown */}
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

  const paymentStatusColor = (status: PAYMENT_STATUS_ENUM) => {
    if (status === PAYMENT_STATUS_ENUM.PAID) return "bg-green-700";
    if (status === PAYMENT_STATUS_ENUM.PENDING) return "bg-red-600";
    if (status === PAYMENT_STATUS_ENUM.PROFORMA) return "bg-yellow-600";
    if (status === PAYMENT_STATUS_ENUM.INVOICE) return "bg-blue-600";
  };

  return (
    <div className="container">
      {renderFilters()}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Invoice Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Pending Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((payment) => (
              <TableRow
                key={`${payment._id}-${payment.payment_identifier}`}
                onClick={() => handleRowClick(payment)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-mono text-xs">
                  {payment._id.slice(-6)}
                </TableCell>
                <TableCell>{labelForType(payment.type)}</TableCell>
                <TableCell>{payment.balance.toFixed(2)}</TableCell>
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
              </TableRow>
            ))}

            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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
              // Show first, last, current and pages around current
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

              // Show ellipsis for skipped pages
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="mt-4">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Name</TableCell>
                    <TableCell>{selectedItem.client_name}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Type</TableCell>
                    <TableCell>{selectedItem.type}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell>
                      <span
                        className={`${paymentStatusColor(selectedItem.status)} text-white px-2 py-1 rounded-md`}
                      >
                        {selectedItem.status}
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Pending Amount
                    </TableCell>
                    <TableCell>
                      {formatCurrency(selectedItem.pending_amount)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Expected Payment Date
                    </TableCell>
                    <TableCell>
                      {formatDate(selectedItem.payment_date)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant={"secondary"} onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            <Button
              className="ml-2"
              onClick={() => {
                setUpdatePayment({
                  modal: true,
                  data: {
                    payment_identifier: selectedItem?.payment_identifier ?? "",
                    status: selectedItem?.status ?? "",
                    payment_receive_date: new Date(
                      selectedItem?.payment_date ?? Date.now(),
                    ),
                    type: selectedItem?.type as IPendingPaymentType,
                    _id: selectedItem?._id ?? "",
                  },
                });
              }}
            >
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={updatePayment.modal}
        onOpenChange={() =>
          setUpdatePayment({ modal: false, data: updatePayment.data })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Form {...form}>
              <form action="" onSubmit={handleSubmit(onSubmit)}>
                <FormItem>
                  <FormLabel htmlFor="payment_identifier">
                    Payment Status
                  </FormLabel>
                  <Input value={PAYMENT_STATUS_ENUM.PAID} disabled />
                </FormItem>

                <br />
                <FormField
                  control={form.control}
                  name={`payment_receive_date`}
                  render={({ field }) => (
                    <FormItem className="w-full mb-4 md:mb-0">
                      <FormLabel className="text-gray-500">
                        Payment Receive Date
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          onDateChange={field.onChange}
                          date={field.value}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="mt-6 flex justify-end">
                  <Button
                    variant={"secondary"}
                    type="button"
                    onClick={() =>
                      setUpdatePayment({
                        modal: false,
                        data: updatePayment.data,
                      })
                    }
                  >
                    Close
                  </Button>
                  <Button
                    className="ml-2 w-36"
                    type="submit"
                    loading={{
                      isLoading,
                      loader: "tailspin",
                    }}
                  >
                    Update
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
