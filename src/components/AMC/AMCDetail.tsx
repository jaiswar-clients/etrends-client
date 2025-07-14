"use client";
import { Button } from "@/components/ui/button";
import {
  File,
  Pencil,
  Info,
  ArrowUp,
  Edit,
  CircleX,
  CircleCheck,
  Trash,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  PAYMENT_STATUS_ENUM,
  useGetAmcByOrderIdQuery,
  useGetAMCPaymentReviewMutation,
  useGetOrderByIdQuery,
  useUpdateAMCByIdMutation,
  useUpdateOrderMutation,
  useDeleteAMCPaymentByIdMutation,
} from "@/redux/api/order";
import Typography from "../ui/Typography";
import OrderDetail from "../Client/Add/Form/OrderDetail";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { IAMCObject, IAMCPayment, OrderDetailInputs } from "@/types/order";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AMCPayment from "./AMCPayment";
import AmcPaymentReview from "./AmcPaymentReview";
import CreateAmcPaymentsIndividualDialog from "./CreateAmcPaymentsIndividualDialog";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";

interface IProps {
  orderId: string;
}

interface IDefaultValues {
  _id: string;
  client: string;
  total_cost: number;
  amc_percentage: number;
  amc_amount: number;
  status: string;
  payments?: IAMCPayment[];
  start_date: Date | undefined;
}

interface DataTableProps {
  data: IAMCPayment[];
  onEdit: (payment: IAMCPayment) => void;
  onInfo: (payment: IAMCPayment, initialAmcRate: number) => void;
  onDelete: (payment: IAMCPayment) => void;
  initialAmcRate: number;
  selectedPayments: string[];
  onSelectPayment: (paymentId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  allSelected: boolean;
}

const columns = (
  onEdit: (payment: IAMCPayment) => void,
  onInfo: (payment: IAMCPayment, initialAmcRate: number) => void,
  onDelete: (payment: IAMCPayment) => void,
  initialAmcRate: number,
  selectedPayments: string[],
  onSelectPayment: (paymentId: string, checked: boolean) => void
): ColumnDef<IAMCPayment>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getRowModel().rows.length > 0 &&
          table
            .getRowModel()
            .rows.every((row) =>
              selectedPayments.includes(row.original._id || "")
            )
        }
        onCheckedChange={(checked) => {
          onSelectPayment("ALL", !!checked);
        }}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedPayments.includes(row.original._id || "")}
        onCheckedChange={(checked) =>
          onSelectPayment(row.original._id || "", !!checked)
        }
        aria-label={`Select row ${row.index + 1}`}
      />
    ),
    size: 32,
  },
  {
    accessorKey: "_id",
    header: "Sr No.",
    cell: ({ row, table }) => {
      const index = table.getRowModel().rows.findIndex((r) => r.id === row.id);

      return <div className="flex items-center gap-2">{index + 1}</div>;
    },
  },
  {
    accessorKey: "from_date",
    header: "From Date",
    cell: ({ row }) => {
      const date = row.getValue("from_date") as string;
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      return <span>{formattedDate}</span>;
    },
  },
  {
    accessorKey: "to_date",
    header: "To Date",
    cell: ({ row }) => {
      const date = row.getValue("to_date") as string;
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      return <span>{formattedDate}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as PAYMENT_STATUS_ENUM;

      const paymentStatusColor = (status: PAYMENT_STATUS_ENUM) => {
        if (status === PAYMENT_STATUS_ENUM.PAID) return "bg-green-700";
        if (status === PAYMENT_STATUS_ENUM.PENDING) return "bg-red-600";
        if (status === PAYMENT_STATUS_ENUM.proforma) return "bg-yellow-600";
        if (status === PAYMENT_STATUS_ENUM.INVOICE) return "bg-blue-600";
      };
      return (
        <div
          className={`px-2 py-1 rounded-md text-center text-white text-xs font-medium ${paymentStatusColor(
            status
          )}`}
        >
          {status}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value === "ALL" || row.getValue(id) === value;
    },
  },
  {
    accessorKey: "received_date",
    header: "Received Date",
    cell: ({ row }) => {
      const date = row.getValue("received_date") as Date;
      return date ? new Date(date).toLocaleDateString() : "-";
    },
  },
  {
    accessorKey: "amc_rate_applied",
    header: "AMC Rate (%)",
    cell: ({ row }) => {
      const rate = row.getValue("amc_rate_applied") as number | undefined;
      if (!rate) return "-";
      return (
        <div className="flex items-center gap-1">
          {rate}%
          {rate > initialAmcRate && (
            <Badge variant="outline" className="bg-green-50">
              <ArrowUp className="w-3 h-3 text-green-600 mr-1" />
              {rate - initialAmcRate}%
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "amc_rate_amount",
    header: "AMC Amount",
    cell: ({ row }) => {
      const amount = row.getValue("amc_rate_amount") as number | undefined;
      return amount ? `₹${amount.toLocaleString()}` : "-";
    },
  },
  {
    accessorKey: "total_cost",
    header: "Total Cost",
    cell: ({ row }) => {
      const amount = row.getValue("total_cost") as number | undefined;
      return amount ? `₹${amount.toLocaleString()}` : "-";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(payment)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onInfo(payment, initialAmcRate)}
          >
            <Info className="w-4 h-4 mr-2" />
            Info
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(payment)}
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      );
    },
  },
];

const DataTable = ({
  data,
  onEdit,
  onInfo,
  onDelete,
  initialAmcRate,
  selectedPayments,
  onSelectPayment,
}: DataTableProps) => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns: columns(
      onEdit,
      onInfo,
      onDelete,
      initialAmcRate,
      selectedPayments,
      onSelectPayment
    ),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    state: {
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={
            !table.getColumn("status")?.getFilterValue() ? "default" : "outline"
          }
          onClick={() => table.getColumn("status")?.setFilterValue("ALL")}
        >
          All
        </Button>
        <Button
          type="button"
          variant={
            table.getColumn("status")?.getFilterValue() ===
            PAYMENT_STATUS_ENUM.PENDING
              ? "default"
              : "outline"
          }
          onClick={() =>
            table
              .getColumn("status")
              ?.setFilterValue(PAYMENT_STATUS_ENUM.PENDING)
          }
        >
          Pending
        </Button>
        <Button
          type="button"
          variant={
            table.getColumn("status")?.getFilterValue() ===
            PAYMENT_STATUS_ENUM.PAID
              ? "default"
              : "outline"
          }
          onClick={() =>
            table.getColumn("status")?.setFilterValue(PAYMENT_STATUS_ENUM.PAID)
          }
        >
          Paid
        </Button>
        <Button
          type="button"
          variant={
            table.getColumn("status")?.getFilterValue() ===
            PAYMENT_STATUS_ENUM.proforma
              ? "default"
              : "outline"
          }
          onClick={() =>
            table
              .getColumn("status")
              ?.setFilterValue(PAYMENT_STATUS_ENUM.proforma)
          }
        >
          proforma
        </Button>
        <Button
          type="button"
          variant={
            table.getColumn("status")?.getFilterValue() ===
            PAYMENT_STATUS_ENUM.INVOICE
              ? "default"
              : "outline"
          }
          onClick={() =>
            table
              .getColumn("status")
              ?.setFilterValue(PAYMENT_STATUS_ENUM.INVOICE)
          }
        >
          Invoice
        </Button>
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
                <TableRow key={row.id}>
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
};

const AmcForm: React.FC<{
  orderId: string;
  defaultValue?: IDefaultValues;
  amcStartDate?: string;
}> = ({ orderId, defaultValue, amcStartDate }) => {
  const [
    getAMCPaymentReviewApi,
    { isLoading: isGetAMCPaymentReviewLoading, data: amcPaymentReviewData },
  ] = useGetAMCPaymentReviewMutation();
  const [enablePaymentEdit, setEnablePaymentEdit] = useState<{
    payment: IAMCPayment | null;
    editing: boolean;
  } | null>({ payment: null, editing: false });
  const [selectedPaymentInfo, setSelectedPaymentInfo] = useState<{
    payment: IAMCPayment | null;
    initialAmcRate: number;
    show: boolean;
  }>({ payment: null, initialAmcRate: 0, show: false });
  const [showPaymentReview, setShowPaymentReview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean;
    payment: IAMCPayment | null;
  }>({ show: false, payment: null });
  const [disableInput, setDisableInput] = useState(true);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showMultiDeleteConfirm, setShowMultiDeleteConfirm] = useState(false);

  const [updateAMCByIdApi, { isLoading: isUpdateAMCByIdLoading }] =
    useUpdateAMCByIdMutation();
  const [deleteAMCPayment, { isLoading: isDeleting }] =
    useDeleteAMCPaymentByIdMutation();

  const form = useForm<Pick<IAMCObject, "amount">>({
    defaultValues: {
      amount: defaultValue?.amc_amount || 0,
    },
    values: {
      amount: defaultValue?.amc_amount || 0,
    },
  });

  const handleEdit = (payment: IAMCPayment) => {
    setEnablePaymentEdit({ payment, editing: true });
  };

  const handleInfo = (payment: IAMCPayment, initialAmcRate: number) => {
    setSelectedPaymentInfo({
      payment,
      initialAmcRate,
      show: true,
    });
  };

  const handleDelete = (payment: IAMCPayment) => {
    setShowDeleteConfirm({ show: true, payment });
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm.payment || !defaultValue?._id) return;

    try {
      await deleteAMCPayment({
        amcId: defaultValue._id,
        paymentId: showDeleteConfirm.payment._id as string,
      }).unwrap();

      toast({
        variant: "success",
        title: "Payment deleted successfully",
      });
      setShowDeleteConfirm({ show: false, payment: null });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong",
      });
    }
  };

  const onSubmit = async (data: Pick<IAMCObject, "amount">) => {
    try {
      await updateAMCByIdApi({
        id: defaultValue?._id || "",
        data: { amount: Number(data.amount) },
      }).unwrap();
      toast({
        variant: "success",
        title: "AMC Updated",
      });
      setDisableInput(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Occured while updating AMC",
        description:
          error?.message ||
          `Please try again and if error still persist contact the developer`,
      });
    }
  };

  const handleSelectPayment = (paymentId: string, checked: boolean) => {
    if (paymentId === "ALL") {
      if (checked && defaultValue?.payments) {
        setSelectedPayments(defaultValue.payments.map((p) => p._id || ""));
      } else {
        setSelectedPayments([]);
      }
    } else {
      setSelectedPayments((prev) =>
        checked ? [...prev, paymentId] : prev.filter((id) => id !== paymentId)
      );
    }
  };
  const allSelected =
    !!defaultValue?.payments &&
    defaultValue.payments.length > 0 &&
    selectedPayments.length === defaultValue.payments.length;

  const handleMultiDelete = () => {
    setShowMultiDeleteConfirm(true);
  };
  const confirmMultiDelete = async () => {
    if (!defaultValue?._id || !selectedPayments.length) return;
    try {
      await Promise.all(
        selectedPayments.map((paymentId) =>
          deleteAMCPayment({ amcId: defaultValue._id, paymentId }).unwrap()
        )
      );
      toast({
        variant: "success",
        title: "Payments deleted successfully",
      });
      setSelectedPayments([]);
      setShowMultiDeleteConfirm(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong",
      });
    }
  };

  return (
    <div className="p-4 mt-4">
      <div className="flex items-center justify-between">
        <Typography variant="h2">AMC Details</Typography>
        {defaultValue?._id && (
          <Button
            type="button"
            className={`w-36 justify-between ${
              !disableInput ? "bg-destructive hover:bg-destructive" : ""
            }`}
            onClick={() => setDisableInput((prev) => !prev)}
          >
            {disableInput ? (
              <>
                <Edit />
                <span>Start Editing</span>
              </>
            ) : (
              <>
                <CircleX />
                <span>Close Editing</span>
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-8 mt-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography variant="h4" className="text-gray-500">
                  AMC Start Date
                </Typography>
                <Typography variant="p">
                  {amcStartDate
                    ? new Date(amcStartDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                      })
                    : "-"}
                </Typography>
              </div>
              <div>
                <Typography variant="h4" className="text-gray-500">
                  Total Cost
                </Typography>
                <Typography variant="p">
                  ₹{defaultValue?.total_cost.toLocaleString()}
                </Typography>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Typography variant="h4" className="text-gray-500">
                  AMC Percentage
                </Typography>
                <Typography variant="p">
                  {defaultValue?.amc_percentage}%
                </Typography>
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AMC Amount</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={disableInput} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              {!disableInput && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setDisableInput(true);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={{
                      isLoading: isUpdateAMCByIdLoading,
                      loader: "tailspin",
                    }}
                  >
                    <CircleCheck className="mr-2" />
                    Save changes
                  </Button>
                </div>
              )}
            </div>
          </form>
        </Form>

        <div className="space-y-6">
          <Typography variant="h2" className="mb-4">
            Payments
          </Typography>

          {defaultValue?.payments?.length ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <CreateAmcPaymentsIndividualDialog
                  amcId={defaultValue._id}
                  clientName={defaultValue.client}
                />
                <Button
                  variant="destructive"
                  disabled={selectedPayments.length === 0}
                  onClick={handleMultiDelete}
                >
                  Delete Selected
                </Button>
              </div>
              <DataTable
                data={defaultValue.payments}
                onEdit={handleEdit}
                onInfo={handleInfo}
                onDelete={handleDelete}
                initialAmcRate={defaultValue?.amc_percentage || 0}
                selectedPayments={selectedPayments}
                onSelectPayment={handleSelectPayment}
                onSelectAll={(checked) => handleSelectPayment("ALL", checked)}
                allSelected={allSelected}
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (!amcStartDate) {
                    toast({
                      variant: "destructive",
                      title: "Error Occured while adding a client",
                      description:
                        "Please add a start date before adding payments",
                    });
                    return;
                  }
                  await getAMCPaymentReviewApi(orderId).unwrap();
                  setShowPaymentReview(true);
                }}
                loading={{
                  isLoading: isGetAMCPaymentReviewLoading,
                  loader: "tailspin",
                }}
              >
                Review and Add Payments
              </Button>

              <CreateAmcPaymentsIndividualDialog
                amcId={defaultValue?._id || ""}
                clientName={defaultValue?.client || ""}
              />
            </div>
          )}
        </div>
      </div>

      {showPaymentReview && (
        <Dialog open={showPaymentReview} onOpenChange={setShowPaymentReview}>
          <DialogContent className="max-w-screen-lg overflow-y-auto max-h-[90vh]">
            <DialogTitle>Payment Review</DialogTitle>
            {amcPaymentReviewData?.data && (
              <AmcPaymentReview
                amcId={defaultValue?._id || ""}
                data={amcPaymentReviewData.data}
                handler={() => {
                  setShowPaymentReview(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {enablePaymentEdit && enablePaymentEdit.payment && (
        <Dialog
          open={enablePaymentEdit.editing}
          onOpenChange={(open) =>
            setEnablePaymentEdit({ payment: null, editing: open })
          }
        >
          <DialogContent className="max-w-screen-lg overflow-y-auto max-h-[90vh]">
            <DialogTitle>Update Payment</DialogTitle>
            <AMCPayment
              payment={enablePaymentEdit.payment}
              amcId={defaultValue?._id || ""}
              onClose={() =>
                setEnablePaymentEdit({ payment: null, editing: false })
              }
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedPaymentInfo.show && selectedPaymentInfo.payment && (
        <Dialog
          open={selectedPaymentInfo.show}
          onOpenChange={(open) =>
            setSelectedPaymentInfo({
              payment: null,
              initialAmcRate: 0,
              show: open,
            })
          }
        >
          <DialogContent className="max-w-md">
            <DialogTitle>Payment Information</DialogTitle>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="p" className="text-sm text-gray-500">
                    Current AMC Rate
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Typography variant="p" className="text-lg font-semibold">
                      {selectedPaymentInfo.payment.amc_rate_applied}%
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="p" className="text-sm text-gray-500">
                    Total Cost
                  </Typography>
                  <Typography variant="p" className="text-lg font-semibold">
                    ₹{defaultValue?.total_cost.toLocaleString()}
                  </Typography>
                </div>
                <div>
                  <Typography variant="p" className="text-sm text-gray-500">
                    AMC Amount
                  </Typography>
                  <Typography variant="p" className="text-lg font-semibold">
                    ₹{defaultValue?.amc_amount.toLocaleString()}
                  </Typography>
                </div>
              </div>

              <div>
                <Typography variant="p" className="text-sm text-gray-500">
                  Payment Period
                </Typography>
                <Typography variant="p" className="text-base">
                  {new Date(
                    selectedPaymentInfo.payment.from_date
                  ).toLocaleDateString()}{" "}
                  -{" "}
                  {new Date(
                    selectedPaymentInfo.payment.to_date
                  ).toLocaleDateString()}
                </Typography>
              </div>

              <div>
                <Typography variant="p" className="text-sm text-gray-500">
                  Documents
                </Typography>
                <div className="space-y-2 mt-2">
                  {selectedPaymentInfo.payment.purchase_order_document && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={
                          selectedPaymentInfo.payment.purchase_order_document
                        }
                        target="_blank"
                      >
                        <Button variant="outline" size="sm">
                          <File className="w-4 h-4 mr-2" />
                          Purchase Order
                        </Button>
                      </Link>
                    </div>
                  )}
                  {selectedPaymentInfo.payment.invoice_document && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={selectedPaymentInfo.payment.invoice_document}
                        target="_blank"
                      >
                        <Button variant="outline" size="sm">
                          <File className="w-4 h-4 mr-2" />
                          Invoice
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={showDeleteConfirm.show}
        onOpenChange={(open) =>
          setShowDeleteConfirm({
            show: open,
            payment: showDeleteConfirm.payment,
          })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setShowDeleteConfirm({ show: false, payment: null })
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              loading={{ isLoading: isDeleting, loader: "tailspin" }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={showMultiDeleteConfirm}
        onOpenChange={setShowMultiDeleteConfirm}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Selected Payments</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the selected payments? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMultiDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmMultiDelete}
              loading={{ isLoading: isDeleting, loader: "tailspin" }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AMCDetail: React.FC<IProps> = ({ orderId }) => {
  const { data } = useGetAmcByOrderIdQuery(orderId);
  const { data: orderData } = useGetOrderByIdQuery(orderId);

  const [defaultValues, setDefaultValues] = useState<IDefaultValues>({
    _id: "",
    client: "",
    total_cost: 0,
    amc_percentage: 0,
    amc_amount: 0,
    status: "",
    start_date: undefined,
  });

  useEffect(() => {
    if (data?.data && orderData?.data) {
      setDefaultValues({
        _id: data?.data._id || "",
        client: data?.data.client.name,
        total_cost: data?.data.total_cost,
        amc_percentage: orderData?.data.amc_rate.percentage,
        amc_amount: data?.data.amount,
        status: orderData?.data.status,
        start_date: data?.data.start_date,
        payments: data?.data.payments,
      });
    }
  }, [data, orderData]);

  const productsName = data?.data.products
    .map((product) => product.name)
    .join(", ");

  const [updateFirstOrderApi, { isLoading: isUpdateOrderLoading }] =
    useUpdateOrderMutation();

  const updateOrderHandler = async (data: OrderDetailInputs) => {
    if (!orderData?.data._id) {
      toast({
        variant: "destructive",
        title: "Error Occured while updating a client",
        description: "Please create a first order before updating",
      });
      return;
    }

    try {
      await updateFirstOrderApi({
        ...data,
        orderId: orderData?.data._id,
      }).unwrap();
      toast({
        variant: "success",
        title: "Order Updated",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Occured while adding a client",
        description:
          error?.message ||
          `Please try again and if error still persist contact the developer`,
      });
    }
  };

  return (
    <>
      <div className="flex items-center">
        <Typography variant="h1" className="md:text-3xl text-2xl">
          {data?.data.client.name} Of {productsName}
        </Typography>
        {orderData?.data.status === "active" ? (
          <div
            className={`md:w-4 md:h-4 w-2.5 h-2.5 rounded-full bg-green-500 ml-2`}
          ></div>
        ) : (
          <div
            className={`md:w-4 md:h-4 w-2.5 h-2.5 rounded-full bg-red-500 ml-2`}
          ></div>
        )}
      </div>

      <br />
      <OrderDetail
        isLoading={isUpdateOrderLoading}
        title="Order Detail"
        handler={async () => {}}
        defaultValue={orderData?.data}
        updateHandler={updateOrderHandler}
        defaultOpen={false}
      />

      <AmcForm
        orderId={orderId}
        defaultValue={defaultValues}
        amcStartDate={orderData?.data.amc_start_date}
      />
    </>
  );
};

export default AMCDetail;
