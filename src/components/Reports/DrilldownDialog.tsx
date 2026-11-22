"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Loading from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/redux/hook";
import {
  buildDrilldownParams,
  drilldownRowHref,
  DrilldownCard,
  IDrilldownColumn,
  useGetDashboardDrilldownQuery,
} from "@/redux/api/report";
import { cn, formatCurrency } from "@/lib/utils";
import { formatPaymentStatus, PAYMENT_STATUS_ENUM } from "@/types/order";

export interface DrilldownRequest {
  card: DrilldownCard;
  title: string;
  period?: string;
}

interface DrilldownDialogProps {
  request: DrilldownRequest | null;
  onClose: () => void;
  fiscalYear: number;
  filter: string;
  orderTypes?: string;
}

const STATUS_ORDER: string[] = [
  PAYMENT_STATUS_ENUM.TO_BE_CREATED,
  PAYMENT_STATUS_ENUM.PROFORMA,
  PAYMENT_STATUS_ENUM.INVOICE,
  PAYMENT_STATUS_ENUM.PAID,
];

const STATUS_BADGE: Record<string, string> = {
  [PAYMENT_STATUS_ENUM.TO_BE_CREATED]: "bg-slate-100 text-slate-700 border-slate-200",
  [PAYMENT_STATUS_ENUM.PROFORMA]: "bg-amber-50 text-amber-800 border-amber-200",
  [PAYMENT_STATUS_ENUM.INVOICE]: "bg-blue-50 text-blue-800 border-blue-200",
  [PAYMENT_STATUS_ENUM.PAID]: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

const formatDate = (v: unknown) => {
  if (!v) return "—";
  const d = new Date(v as string);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const renderCell = (col: IDrilldownColumn, value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">—</span>;
  }
  switch (col.type) {
    case "currency":
      return formatCurrency(Number(value));
    case "date":
      return formatDate(value);
    case "percent":
      return `${Number(value).toFixed(1)}%`;
    case "status":
      return (
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium", STATUS_BADGE[String(value)])}>
          {formatPaymentStatus(String(value))}
        </Badge>
      );
    default:
      return String(value);
  }
};

const matchesSearch = (row: Record<string, any>, columns: IDrilldownColumn[], term: string) =>
  columns.some((c) => {
    if (c.type !== "text" && c.type !== "status") return false;
    const raw = String(row[c.key] ?? "").toLowerCase();
    const label = c.type === "status" ? formatPaymentStatus(String(row[c.key] ?? "")).toLowerCase() : "";
    return raw.includes(term) || label.includes(term);
  });

const DrilldownBody = ({ request, fiscalYear, filter, orderTypes }: Omit<DrilldownDialogProps, "onClose"> & { request: DrilldownRequest }) => {
  const { toast } = useToast();
  const router = useRouter();
  const token = useAppSelector((state) => state.user.user.token);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const args = { card: request.card, fiscalYear, filter, orderTypes, period: request.period };
  const { data, isFetching, isError } = useGetDashboardDrilldownQuery(args);
  const table = data?.data;

  // One chip group per filter column (e.g. Category: New Order / AMC, Status: ...)
  const chipGroups = useMemo(() => {
    if (!table?.filterKeys?.length) return [];
    return table.filterKeys.map((key) => {
      const counts = new Map<string, number>();
      for (const row of table.rows) {
        const v = String(row[key] ?? "");
        if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const entries = [...counts.entries()];
      if (key === "status") {
        entries.sort((a, b) => STATUS_ORDER.indexOf(a[0]) - STATUS_ORDER.indexOf(b[0]));
      } else if (key === "category") {
        entries.sort((a, b) => (a[0] === "New Order" ? -1 : b[0] === "New Order" ? 1 : 0));
      } else {
        entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      }
      return {
        key,
        label: table.columns.find((c) => c.key === key)?.label ?? key,
        chips: entries.map(([value, count]) => ({
          value,
          count,
          label: key === "status" ? formatPaymentStatus(value) : value,
        })),
      };
    });
  }, [table]);

  const rows = useMemo(() => {
    if (!table) return [];
    const term = search.trim().toLowerCase();
    return table.rows.filter(
      (row) =>
        Object.entries(selected).every(([key, values]) => !values.length || values.includes(String(row[key]))) &&
        (!term || matchesSearch(row, table.columns, term))
    );
  }, [table, selected, search]);

  // Subtotals of the first currency column per group (e.g. New Order / AMC)
  const subtotals = useMemo(() => {
    const amountCol = table?.columns.find((c) => c.type === "currency");
    if (!table?.subtotalKey || !amountCol) return [];
    const sums = new Map<string, { amount: number; count: number }>();
    for (const row of rows) {
      const g = String(row[table.subtotalKey] ?? "");
      const s = sums.get(g) ?? { amount: 0, count: 0 };
      s.amount += Number(row[amountCol.key]) || 0;
      s.count += 1;
      sums.set(g, s);
    }
    return [...sums.entries()]
      .sort((a, b) => (a[0] === "New Order" ? -1 : b[0] === "New Order" ? 1 : a[0].localeCompare(b[0])))
      .map(([group, s]) => ({ group, ...s }));
  }, [table, rows]);

  const hasSelection = Object.values(selected).some((v) => v.length > 0);

  const totals = useMemo(() => {
    if (!table) return {};
    const out: Record<string, number> = {};
    for (const col of table.columns) {
      if (col.type === "currency") out[col.key] = rows.reduce((s, r) => s + (Number(r[col.key]) || 0), 0);
    }
    return out;
  }, [table, rows]);

  const toggle = (key: string, value: string) =>
    setSelected((prev) => {
      const current = prev[key] ?? [];
      return {
        ...prev,
        [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      };
    });

  const handleExport = async () => {
    if (!token) return;
    setIsExporting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const params = buildDrilldownParams({ ...args, filters: selected, search });
      const response = await fetch(`${apiUrl}/reports/drilldown/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Export failed (${response.status})`);
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const fileName =
        disposition.match(/filename="?([^";]+)"?/)?.[1] ||
        `${request.card}_FY_${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not export the table",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DialogHeader className="space-y-1">
        <div className="flex items-start justify-between gap-3 pr-6">
          <div>
            <DialogTitle className="text-base font-bold text-slate-900">{table?.title ?? request.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">{table?.subtitle ?? "Loading…"}</DialogDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs shrink-0"
            onClick={handleExport}
            disabled={isExporting || !table || rows.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Exporting…" : `Export Excel (${rows.length})`}
          </Button>
        </div>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-56">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, product, invoice…"
            className="h-8 pl-7 text-xs"
          />
        </div>
        {chipGroups.map((group) => (
          <div key={group.key} className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{group.label}</span>
            {group.chips.map((chip) => {
              const active = (selected[group.key] ?? []).includes(chip.value);
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => toggle(group.key, chip.value)}
                  aria-pressed={active}
                  className={cn(
                    "h-7 px-2.5 rounded-full border text-[11px] font-medium transition-colors",
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  )}
                >
                  {chip.label} <span className="opacity-70">{chip.count}</span>
                </button>
              );
            })}
          </div>
        ))}
        {(hasSelection || search) && (
          <button
            type="button"
            onClick={() => {
              setSelected({});
              setSearch("");
            }}
            className="h-7 px-2 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {subtotals.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {subtotals.map((s) => (
            <div key={s.group} className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">
              <span className="text-slate-500">{s.group}</span>{" "}
              <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(s.amount)}</span>{" "}
              <span className="text-slate-400">· {s.count} rows</span>
            </div>
          ))}
        </div>
      )}

      {isFetching && !table ? (
        <div className="py-12"><Loading /></div>
      ) : isError ? (
        <div className="py-12 text-center text-sm text-red-600">Could not load details.</div>
      ) : table ? (
        <div className="border border-slate-200 rounded-lg overflow-auto max-h-[60vh]">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 border-b border-slate-200 w-8" aria-label="Open" />
                {table.columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-3 py-2 font-semibold text-slate-600 whitespace-nowrap border-b border-slate-200",
                      ["currency", "number", "percent"].includes(col.type) ? "text-right" : "text-left"
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length > 0 ? (
                rows.map((row, idx) => {
                  const href = drilldownRowHref(row._ref);
                  return (
                  <tr
                    key={idx}
                    className={cn("hover:bg-slate-50", href && "cursor-pointer")}
                    onClick={(e) => {
                      if (!href) return;
                      // Ctrl / Cmd click opens a new tab, plain click navigates here
                      if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
                      else router.push(href);
                    }}
                    title={href ? "Open details" : undefined}
                  >
                    <td className="px-2 py-1.5">
                      {href && (
                        <Link
                          href={href}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex text-slate-400 hover:text-blue-600"
                          aria-label={`Open ${row.clientName ?? "details"}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </td>
                    {table.columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-1.5 text-slate-800 whitespace-nowrap",
                          ["currency", "number", "percent"].includes(col.type) && "text-right tabular-nums"
                        )}
                      >
                        {renderCell(col, row[col.key])}
                      </td>
                    ))}
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={table.columns.length + 1} className="px-3 py-8 text-center text-slate-500">
                    No rows
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && Object.keys(totals).length > 0 && (
              <tfoot className="bg-slate-50 sticky bottom-0">
                <tr className="font-semibold text-slate-900">
                  <td className="border-t border-slate-200" />
                  {table.columns.map((col, i) => (
                    <td
                      key={col.key}
                      className={cn("px-3 py-2 whitespace-nowrap border-t border-slate-200", col.type === "currency" && "text-right tabular-nums")}
                    >
                      {col.type === "currency" ? formatCurrency(totals[col.key]) : i === 0 ? `Total · ${rows.length} rows` : ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      ) : null}
    </>
  );
};

/** Drill-down table + Excel dump for a Revenue Dashboard card. */
const DrilldownDialog = ({ request, onClose, ...rest }: DrilldownDialogProps) => (
  <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-[min(1200px,95vw)] max-h-[90vh] flex flex-col gap-3">
      {request && (
        <DrilldownBody
          key={`${request.card}|${request.period ?? ""}`}
          request={request}
          {...rest}
        />
      )}
    </DialogContent>
  </Dialog>
);

export default DrilldownDialog;
