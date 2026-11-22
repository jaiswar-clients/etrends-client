"use client";

import React, { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
  Label,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import {
  useGetRevenueDashboardQuery,
  useGetExpectedVsCollectedQuery,
  useGetClientHealthDashboardQuery,
  useGetRevenuePipelineQuery,
  IReportQueries,
} from "@/redux/api/report";
import DrilldownDialog, { type DrilldownRequest } from "@/components/Reports/DrilldownDialog";
import type { DrilldownCard } from "@/redux/api/report";

// Used to reopen a drill-down from the URL (?drill=...&drillPeriod=...)
const DRILL_TITLES: Record<DrilldownCard, string> = {
  "total-revenue": "Total Revenue",
  "new-sales": "New Sales Revenue",
  "amc-revenue": "AMC Revenue",
  "revenue-split": "Revenue Split",
  "revenue-trend": "Revenue",
  "collection-rate": "Collection",
  "sales-collection": "Sales Collection",
  "amc-collection": "AMC Collection",
  "expected-vs-collected": "Expected vs Collected",
  "client-health": "Client Health",
  "client-performance": "Client Performance",
  "concentration-risk": "Concentration Risk",
  "expected-revenue": "Expected Revenue",
  proforma: "Proforma Invoice",
  "to-be-created": "To be Created",
};

import { useAppSelector } from "@/redux/hook";
import { cn, formatCurrency, formatIndianNumber } from "@/lib/utils";
import {
  Calendar,
  Building2,
  Receipt,
  Target,
  IndianRupee,
  BarChart3,
  Download,
  AlertCircle,
  Heart,
  TableProperties,
  TrendingUp,
  FileText,
  FilePlus2,
} from "lucide-react";

const DEFAULT_FILTER = "monthly" as const;
type FilterType = "monthly" | "quarterly";
const CHART_COLORS = {
  newSales: "#1e40af",
  amc: "#059669",
  // Expected vs Collected stack: yellow = expected, blue = invoiced, green = collected
  expected: "#e0a106",
  invoiced: "#2563eb",
  collected: "#16a34a",
};

const ORDER_TYPE_OPTIONS = [
  { label: "All", value: "all" },
  { label: "New Sales", value: "new" },
  { label: "AMC", value: "amc" },
] as const;

const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const fiscalYearStart = currentMonth < 3 ? currentYear - 1 : currentYear;
  return Array.from({ length: 16 }, (_, i) => {
    const year = fiscalYearStart - i;
    return { label: `FY ${year}-${(year + 1).toString().slice(-2)}`, value: year.toString() };
  });
};

const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;
};

const revenueChartConfig = {
  newSalesRevenue: { label: "New Sales", color: CHART_COLORS.newSales },
  amcRevenue: { label: "AMC Revenue", color: CHART_COLORS.amc },
} satisfies ChartConfig;

// Fiscal order for labels like "Apr FY26-27", "Q1 FY26-27", "H1 FY26-27"
const FISCAL_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const periodSortKey = (period: string) => {
  const fy = Number(period.match(/FY(\d{2})-/)?.[1] ?? 0);
  const month = FISCAL_MONTHS.findIndex((m) => period.startsWith(m));
  const quarter = period.match(/^Q(\d)/)?.[1];
  const half = period.match(/^H(\d)/)?.[1];
  const within = month >= 0 ? month : quarter ? (Number(quarter) - 1) * 3 : half ? (Number(half) - 1) * 6 : 0;
  return fy * 100 + within;
};

// Makes a card open its drill-down on click / Enter / Space
const clickable = (onClick?: () => void) =>
  onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
        className:
          "cursor-pointer transition-shadow hover:shadow-md hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
      }
    : { className: "" };

const DetailsButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    title="View details & export"
  >
    <TableProperties className="w-3 h-3" />
    Details
  </button>
);

// Compact Tooltip
const CompactTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, p: any) => sum + p.value, 0);
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2 shadow-xl text-xs">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: entry.color }} />
              <span className="text-slate-600">{entry.name}</span>
            </div>
            <span className="font-semibold text-slate-800">{formatCurrency(entry.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 pt-1 mt-1 border-t border-slate-100">
          <span className="font-medium text-slate-700">Total</span>
          <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

type CollectionChartRow = {
  period: string;
  expected: number;
  invoiced: number;
  collected: number;
  // stacked segments (bottom -> top), sum = expected
  collectedSeg: number;
  invoicedSeg: number;
  expectedSeg: number;
};

// Tooltip for the Expected vs Collected stack: shows cumulative amounts, not segment heights
const CollectionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as CollectionChartRow;
  const items = [
    { name: "Expected", value: row.expected, color: CHART_COLORS.expected },
    { name: "Invoiced", value: row.invoiced, color: CHART_COLORS.invoiced },
    { name: "Collected", value: row.collected, color: CHART_COLORS.collected },
  ];
  const rate = row.invoiced > 0 ? (row.collected / row.invoiced) * 100 : 0;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-2 shadow-xl text-xs">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ background: item.color }} />
            <span className="text-slate-600">{item.name}</span>
          </div>
          <span className="font-semibold text-slate-800">{formatCurrency(item.value)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3 pt-1 mt-1 border-t border-slate-100">
        <span className="font-medium text-slate-700">Collected of invoiced</span>
        <span className="font-bold text-slate-900">{rate.toFixed(0)}%</span>
      </div>
    </div>
  );
};

// Compact KPI Card
const CompactKPICard = ({ title, value, subtitle, icon: Icon, color = "#1e40af", onClick }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
  onClick?: () => void;
}) => {
  const { className: clickClass, ...clickProps } = clickable(onClick);
  return (
  <div {...clickProps} title={onClick ? `${title}: view details & export` : undefined} className={cn("bg-white rounded-lg border border-slate-200 p-3 shadow-sm", clickClass)}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
    </div>
  </div>
  );
};

// Collection Progress
const CompactCollectionProgress = ({ title, invoiced, collected, icon: Icon, onClick }: {
  title: string;
  invoiced: number;
  collected: number;
  icon: React.ElementType;
  onClick?: () => void;
}) => {
  const { className: clickClass, ...clickProps } = clickable(onClick);
  const percentage = invoiced > 0 ? (collected / invoiced) * 100 : 0;
  const isGood = percentage >= 80;
  const isMedium = percentage >= 60 && percentage < 80;
  const color = isGood ? "bg-emerald-500" : isMedium ? "bg-amber-500" : "bg-red-500";
  const textColor = isGood ? "text-emerald-700" : isMedium ? "text-amber-700" : "text-red-700";

  return (
    <div {...clickProps} title={onClick ? `${title}: view details & export` : undefined} className={cn("bg-white rounded-lg border border-slate-200 p-3 shadow-sm", clickClass)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-700">{title}</span>
        </div>
        <span className={cn("text-xs font-bold", textColor)}>{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
        <span>Inv: {formatIndianNumber(invoiced).replace("₹", "")}</span>
        <span>Col: {formatIndianNumber(collected).replace("₹", "")}</span>
      </div>
    </div>
  );
};

// Revenue Donut
const CompactRevenueDonut = ({ newSales, amc, onDetails }: { newSales: number; amc: number; onDetails?: () => void }) => {
  const total = newSales + amc;
  const data = [
    { name: "New Sales", value: newSales, color: CHART_COLORS.newSales },
    { name: "AMC", value: amc, color: CHART_COLORS.amc },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-700">Revenue Split</p>
        {onDetails && <DetailsButton onClick={onDetails} />}
      </div>
      <div className="flex items-center gap-3">
        <ChartContainer config={revenueChartConfig} className="h-[80px] w-[80px]">
          <PieChart width={80} height={80}>
            <Pie data={data} dataKey="value" innerRadius={25} outerRadius={38} paddingAngle={2} strokeWidth={0}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox && typeof viewBox.cy === "number") {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-[9px] font-bold">
                          {formatIndianNumber(total).replace("₹", "").replace(/\s/g, "")}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex-1 space-y-1">
          {data.map((item, idx) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
            return (
              <div key={idx} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Compact Client Health: total / active / inactive clients
const CompactClientHealthScorecard = ({ healthMetrics, onDetails }: {
  onDetails?: () => void;
  healthMetrics: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
  };
}) => (
  <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        <Heart className="w-4 h-4 text-rose-500" />
        <h3 className="text-xs font-semibold text-slate-900">Client Health</h3>
      </div>
      {onDetails && <DetailsButton onClick={onDetails} />}
    </div>

    <div className="grid grid-cols-3 gap-2">
      <div className="bg-slate-50 rounded p-2 text-center">
        <p className="text-[10px] text-slate-500">Total Clients</p>
        <p className="text-lg font-bold text-slate-900">{healthMetrics.totalClients}</p>
      </div>
      <div className="bg-emerald-50 rounded p-2 text-center">
        <p className="text-[10px] text-emerald-700">Active</p>
        <p className="text-lg font-bold text-emerald-700">{healthMetrics.activeClients}</p>
      </div>
      <div className="bg-slate-50 rounded p-2 text-center">
        <p className="text-[10px] text-slate-500">Inactive</p>
        <p className="text-lg font-bold text-slate-700">{healthMetrics.inactiveClients}</p>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
const RevenueReportDashboard = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const defaultFiscalYear = currentMonth < 3 ? currentYear - 1 : currentYear;

  // Initialize state from URL search params
  const urlFy = searchParams.get("fy");
  const urlFilter = searchParams.get("filter") as FilterType | null;
  const urlOrderTypes = searchParams.get("orderTypes");

  const [fiscalYear, setFiscalYearState] = useState<number>(
    urlFy && !isNaN(Number(urlFy)) ? Number(urlFy) : defaultFiscalYear
  );
  const [filterType, setFilterTypeState] = useState<FilterType>(
    urlFilter && ["monthly", "quarterly", "half-yearly"].includes(urlFilter)
      ? urlFilter
      : DEFAULT_FILTER
  );
  const urlDrill = searchParams.get("drill") as DrilldownCard | null;
  const urlDrillPeriod = searchParams.get("drillPeriod");
  const [drill, setDrillState] = useState<DrilldownRequest | null>(
    urlDrill && DRILL_TITLES[urlDrill]
      ? { card: urlDrill, title: DRILL_TITLES[urlDrill], period: urlDrillPeriod ?? undefined }
      : null
  );
  // Keep the open drill-down in the URL so browser Back from a detail page reopens it
  const setDrill = useCallback(
    (req: DrilldownRequest | null) => {
      setDrillState(req);
      const params = new URLSearchParams(window.location.search);
      if (req) {
        params.set("drill", req.card);
        if (req.period) params.set("drillPeriod", req.period);
        else params.delete("drillPeriod");
      } else {
        params.delete("drill");
        params.delete("drillPeriod");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname]
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [orderTypes, setOrderTypesState] = useState<string>(
    urlOrderTypes || "all"
  );

  // Sync filters to URL
  const updateUrlParams = useCallback(
    (updates: { fy?: number; filter?: FilterType; orderTypes?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      const fy = updates.fy ?? fiscalYear;
      const filter = updates.filter ?? filterType;
      const ot = updates.orderTypes ?? orderTypes;

      params.set("fy", fy.toString());
      params.set("filter", filter);
      if (ot && ot !== "all") {
        params.set("orderTypes", ot);
      } else {
        params.delete("orderTypes");
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname, fiscalYear, filterType, orderTypes]
  );

  const setFiscalYear = useCallback(
    (fy: number) => {
      setFiscalYearState(fy);
      updateUrlParams({ fy });
    },
    [updateUrlParams]
  );
  const setFilterType = useCallback(
    (filter: FilterType) => {
      setFilterTypeState(filter);
      updateUrlParams({ filter });
    },
    [updateUrlParams]
  );
  const setOrderTypes = useCallback(
    (ot: string) => {
      setOrderTypesState(ot);
      updateUrlParams({ orderTypes: ot });
    },
    [updateUrlParams]
  );

  // Get token from Redux store
  const token = useAppSelector((state) => state.user.user.token);

  const revenueFilters: IReportQueries = useMemo(() => ({
    filter: filterType,
    options: { year: fiscalYear, orderTypes },
  }), [fiscalYear, filterType, orderTypes]);

  const { data: revenueData, isLoading: isRevenueLoading } = useGetRevenueDashboardQuery(revenueFilters);
  const { data: expectedVsCollectedData, isLoading: isExpectedVsCollectedLoading } = useGetExpectedVsCollectedQuery({ fiscalYear, filter: filterType, orderTypes });
  const { data: clientHealthData, isLoading: isClientHealthLoading } = useGetClientHealthDashboardQuery({ fiscalYear });
  const { data: pipelineData } = useGetRevenuePipelineQuery({ fiscalYear, orderTypes });

  const revenueChartData = useMemo(() => {
    return revenueData?.data?.monthlyBreakdown.map((item) => ({
      period: item.period,
      newSalesRevenue: item.newSalesRevenue,
      amcRevenue: item.amcRevenue,
      total: item.totalRevenue,
    })) || [];
  }, [revenueData]);

  const collectionChartData = useMemo((): CollectionChartRow[] => {
    if (!expectedVsCollectedData?.data) return [];
    const periodMap = new Map<string, { period: string; expected: number; invoiced: number; collected: number }>();
    [...expectedVsCollectedData.data.newSales.breakdown, ...expectedVsCollectedData.data.amc.breakdown].forEach((item) => {
      const existing = periodMap.get(item.period) || { period: item.period, expected: 0, invoiced: 0, collected: 0 };
      existing.expected += item.expected;
      existing.invoiced += item.invoiced ?? 0;
      existing.collected += item.collected;
      periodMap.set(item.period, existing);
    });
    // One stacked bar per period: collected (green) + invoiced-not-collected (blue) + expected-not-invoiced (yellow)
    return Array.from(periodMap.values()).sort((a, b) => periodSortKey(a.period) - periodSortKey(b.period)).map((row) => ({
      ...row,
      collectedSeg: row.collected,
      invoicedSeg: Math.max(row.invoiced - row.collected, 0),
      expectedSeg: Math.max(row.expected - row.invoiced, 0),
    }));
  }, [expectedVsCollectedData]);

  const summary = useMemo(() => {
    const newSales = revenueData?.data?.summary.totalNewSalesRevenue || 0;
    const amc = revenueData?.data?.summary.totalAMCRevenue || 0;
    const total = newSales + amc;
    const collected = expectedVsCollectedData?.data?.total.collected || 0;
    const invoiced = expectedVsCollectedData?.data?.total.invoiced || 0;
    // Collection rate = collected / invoiced (what has been billed)
    const collectionRate = invoiced > 0 ? (collected / invoiced) * 100 : 0;
    // Pipeline cards: Exp Revenue = Total Revenue + Proforma + To be Created
    const proforma = pipelineData?.data?.proforma ?? { newSales: 0, amc: 0, total: 0 };
    const toBeCreated = pipelineData?.data?.toBeCreated ?? { newSales: 0, amc: 0, total: 0 };
    const expectedRevenue = total + proforma.total + toBeCreated.total;
    return { newSales, amc, total, collected, invoiced, collectionRate, proforma, toBeCreated, expectedRevenue };
  }, [revenueData, expectedVsCollectedData, pipelineData]);

  const handleBarClick = (barData: any) => {
    if (barData?.period) setDrill({ card: "revenue-trend", title: "Revenue", period: barData.period });
  };
  const handleCollectionBarClick = (barData: any) => {
    if (barData?.period) setDrill({ card: "expected-vs-collected", title: "Expected vs Collected", period: barData.period });
  };

  const handleDownloadExcel = async () => {
    setIsExporting(true);
    try {
      // Get the API URL from environment variable
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      if (!token) {
        console.error('No authentication token found');
        // Show error toast or notification
        return;
      }

      const params = new URLSearchParams();
      params.append('fiscalYear', fiscalYear.toString());
      params.append('filter', filterType);
      if (orderTypes) params.append('orderTypes', orderTypes);

      const response = await fetch(
        `${apiUrl}/reports/export-excel?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Revenue_Report_FY_${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
      // Show error toast or notification
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = isRevenueLoading || isExpectedVsCollectedLoading || isClientHealthLoading;
  const fyLabel = `FY ${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}`;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Compact Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Revenue Dashboard</h1>
                <p className="text-[10px] text-slate-500">{fyLabel} • Updated {getCurrentPeriod()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
                <Calendar className="w-3 h-3 text-slate-500" />
                <Select value={fiscalYear.toString()} onValueChange={(v) => setFiscalYear(Number(v))}>
                  <SelectTrigger className="w-[120px] border-0 bg-transparent shadow-none h-7 text-xs">
                    <SelectValue placeholder="Fiscal Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYears().map((y) => (
                      <SelectItem key={y.value} value={y.value} className="text-xs">{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
                <BarChart3 className="w-3 h-3 text-slate-500" />
                <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                  <SelectTrigger className="w-[100px] border-0 bg-transparent shadow-none h-7 text-xs">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                    <SelectItem value="quarterly" className="text-xs">Quarterly</SelectItem>
                    <SelectItem value="half-yearly" className="text-xs">Half Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleDownloadExcel}
                disabled={isExporting}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-3"
              >
                <Download className="w-3 h-3" />
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] text-slate-500 mr-1">Revenue Stream:</span>
            {ORDER_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setOrderTypes(opt.value)}
                className={cn(
                  "px-2.5 py-0.5 text-[10px] font-medium rounded-full border transition-colors",
                  orderTypes === opt.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Compact Layout */}
      <div className="max-w-[1600px] mx-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="py-10"><Loading /></div>
        ) : (
          <>
            {/* Row 1: Pipeline cards. Exp Revenue = Total Revenue + Proforma + To be Created */}
            <div className="grid grid-cols-4 gap-2">
              <CompactKPICard title="Exp Revenue" value={formatIndianNumber(summary.expectedRevenue)} subtitle={`Total + Proforma + To be Created · ${formatCurrency(summary.expectedRevenue)}`} icon={TrendingUp} color="#ca8a04" onClick={() => setDrill({ card: "expected-revenue", title: "Expected Revenue" })} />
              <CompactKPICard title="Total Revenue" value={formatIndianNumber(summary.total)} subtitle={`Invoice + Paid · ${formatCurrency(summary.total)}`} icon={IndianRupee} color="#1e40af" onClick={() => setDrill({ card: "total-revenue", title: "Total Revenue" })} />
              <CompactKPICard title="Proforma Invoice" value={formatIndianNumber(summary.proforma.total)} subtitle={`New ${formatIndianNumber(summary.proforma.newSales)} · AMC ${formatIndianNumber(summary.proforma.amc)}`} icon={FileText} color="#ea580c" onClick={() => setDrill({ card: "proforma", title: "Proforma Invoice" })} />
              <CompactKPICard title="To be Created" value={formatIndianNumber(summary.toBeCreated.total)} subtitle={`New ${formatIndianNumber(summary.toBeCreated.newSales)} · AMC ${formatIndianNumber(summary.toBeCreated.amc)}`} icon={FilePlus2} color="#64748b" onClick={() => setDrill({ card: "to-be-created", title: "To be Created" })} />
            </div>

            {/* Row 2: Revenue split & collection */}
            <div className="grid grid-cols-5 gap-2">
              <CompactKPICard title="New Sales" value={formatIndianNumber(summary.newSales)} subtitle={formatCurrency(summary.newSales)} icon={Building2} color="#1e40af" onClick={() => setDrill({ card: "new-sales", title: "New Sales Revenue" })} />
              <CompactKPICard title="AMC Revenue" value={formatIndianNumber(summary.amc)} subtitle={formatCurrency(summary.amc)} icon={Receipt} color="#059669" onClick={() => setDrill({ card: "amc-revenue", title: "AMC Revenue" })} />
              <CompactKPICard title="Collection Rate" value={`${summary.collectionRate.toFixed(0)}%`} subtitle={`of ${formatCurrency(summary.invoiced)} invoiced`} icon={Target} color={summary.collectionRate >= 80 ? "#059669" : summary.collectionRate >= 60 ? "#f59e0b" : "#dc2626"} onClick={() => setDrill({ card: "collection-rate", title: "Collection" })} />
              <CompactCollectionProgress title="Sales Collection" invoiced={expectedVsCollectedData?.data?.newSales.invoiced || 0} collected={expectedVsCollectedData?.data?.newSales.collected || 0} icon={Building2} onClick={() => setDrill({ card: "sales-collection", title: "Sales Collection" })} />
              <CompactCollectionProgress title="AMC Collection" invoiced={expectedVsCollectedData?.data?.amc.invoiced || 0} collected={expectedVsCollectedData?.data?.amc.collected || 0} icon={Receipt} onClick={() => setDrill({ card: "amc-collection", title: "AMC Collection" })} />
            </div>

            {/* Row 2: Charts */}
            <div className="grid grid-cols-3 gap-3">
              {/* Revenue Trend Chart */}
              <div className="col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">Revenue Trend</h3>
                    <p className="text-[10px] text-slate-500">Click bars for details</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <DetailsButton onClick={() => setDrill({ card: "revenue-trend", title: "Revenue Trend" })} />
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.newSales }} /><span className="text-slate-600">New Sales</span></div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.amc }} /><span className="text-slate-600">AMC</span></div>
                  </div>
                </div>
                <div className="p-2">
                  {revenueChartData.length > 0 ? (
                    <ChartContainer config={revenueChartConfig} className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={revenueChartData} barCategoryGap="15%">
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fill: "#64748b", fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 9 }} tickFormatter={(v) => v >= 10000000 ? `${(v/10000000).toFixed(0)}Cr` : v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                          <ChartTooltip content={<CompactTooltip />} />
                          <Bar name="New Sales" dataKey="newSalesRevenue" stackId="a" fill={CHART_COLORS.newSales} cursor="pointer" onClick={handleBarClick} />
                          <Bar name="AMC Revenue" dataKey="amcRevenue" stackId="a" fill={CHART_COLORS.amc} radius={[2, 2, 0, 0]} cursor="pointer" onClick={handleBarClick} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-slate-500 text-xs">No data available</div>
                  )}
                </div>
              </div>

              {/* Expected vs Collected + Revenue Split */}
              <div className="space-y-2">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-900">Expected vs Collected</h3>
                    <div className="flex items-center gap-2 text-[10px]">
                      <DetailsButton onClick={() => setDrill({ card: "expected-vs-collected", title: "Expected vs Collected" })} />
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.expected }} /><span className="text-slate-600">Expected</span></div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.invoiced }} /><span className="text-slate-600">Invoiced</span></div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS.collected }} /><span className="text-slate-600">Collected</span></div>
                    </div>
                  </div>
                  <div className="p-2">
                    {collectionChartData.length > 0 ? (
                      <ChartContainer config={revenueChartConfig} className="h-[130px] w-full">
                        <ResponsiveContainer width="100%" height={130}>
                          <BarChart data={collectionChartData} barCategoryGap="30%">
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fill: "#64748b", fontSize: 8 }} angle={-45} textAnchor="end" height={40} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 8 }} tickFormatter={(v) => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                            <ChartTooltip content={<CollectionTooltip />} />
                            <Bar name="Collected" dataKey="collectedSeg" stackId="evc" fill={CHART_COLORS.collected} stroke="#fff" strokeWidth={1} cursor="pointer" onClick={handleCollectionBarClick} />
                            <Bar name="Invoiced" dataKey="invoicedSeg" stackId="evc" fill={CHART_COLORS.invoiced} stroke="#fff" strokeWidth={1} cursor="pointer" onClick={handleCollectionBarClick} />
                            <Bar name="Expected" dataKey="expectedSeg" stackId="evc" fill={CHART_COLORS.expected} stroke="#fff" strokeWidth={1} radius={[2, 2, 0, 0]} cursor="pointer" onClick={handleCollectionBarClick} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="h-[130px] flex items-center justify-center text-slate-500 text-xs">No data</div>
                    )}
                  </div>
                </div>
                <CompactRevenueDonut newSales={summary.newSales} amc={summary.amc} onDetails={() => setDrill({ card: "revenue-split", title: "Revenue Split" })} />
              </div>
            </div>

            {/* Row 3: Client Health & Retention Section */}
            {clientHealthData?.data && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs font-medium text-slate-600">Client Health & Retention</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <CompactClientHealthScorecard healthMetrics={clientHealthData.data.healthMetrics} onDetails={() => setDrill({ card: "client-health", title: "Client Health" })} />
              </>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded text-[10px] text-slate-500">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Click any card, Details button or chart bar for the full table &amp; Excel export</span>
              </div>
              <span>Generated: {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
            </div>
          </>
        )}
      </div>

      {/* Drill-down table + Excel export for every card */}
      <DrilldownDialog
        request={drill}
        onClose={() => setDrill(null)}
        fiscalYear={fiscalYear}
        filter={filterType}
        orderTypes={orderTypes}
      />
    </div>
  );
};

const Page = () => (
  <Suspense fallback={<Loading />}>
    <RevenueReportDashboard />
  </Suspense>
);

export default Page;
