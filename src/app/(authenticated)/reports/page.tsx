"use client";

import React, { useState, useMemo, useRef } from "react";
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
  Line,
  LineChart,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
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
import Typography from "@/components/ui/Typography";
import Loading from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useGetRevenueDashboardQuery,
  useGetExpectedVsCollectedQuery,
  useGetMonthlyRevenueBreakdownQuery,
  IReportQueries,
} from "@/redux/api/report";
import { cn, formatCurrency, formatIndianNumber } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Building2,
  Receipt,
  Target,
  DollarSign,
  PieChartIcon,
  BarChart3,
  FileText,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
} from "lucide-react";

// Constants
const DEFAULT_FILTER = "monthly" as const;
const CHART_COLORS = {
  newSales: "#1e40af", // Deep blue
  amc: "#059669", // Emerald
  expected: "#6366f1", // Indigo
  collected: "#10b981", // Green
  accent: "#f59e0b", // Amber
  muted: "#64748b", // Slate
};

// Helper functions
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const fiscalYears = [];
  const currentMonth = new Date().getMonth();
  const fiscalYearStart = currentMonth < 3 ? currentYear - 1 : currentYear;

  for (let i = fiscalYearStart; i >= fiscalYearStart - 15; i--) {
    const endYear = i + 1;
    const label = `FY ${i}-${endYear.toString().slice(-2)}`;
    fiscalYears.push({ label, value: i.toString() });
  }
  return fiscalYears;
};

const getQuarterLabel = (month: number): string => {
  if (month >= 3 && month <= 5) return "Q1";
  if (month >= 6 && month <= 8) return "Q2";
  if (month >= 9 && month <= 11) return "Q3";
  return "Q4";
};

const getCurrentPeriod = (): string => {
  const now = new Date();
  const month = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  return `${month} ${year}`;
};

// Chart Config
const revenueChartConfig = {
  newSalesRevenue: { label: "New Sales", color: CHART_COLORS.newSales },
  amcRevenue: { label: "AMC Revenue", color: CHART_COLORS.amc },
} satisfies ChartConfig;

// Professional Tooltip
const ProfessionalTooltip = ({ active, payload, label, type = "revenue" }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, p: any) => sum + p.value, 0);

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-4 shadow-xl min-w-[180px]">
        <p className="font-semibold text-slate-800 text-sm mb-3 pb-2 border-b border-slate-100">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ background: entry.color }} />
              <span className="text-sm text-slate-600">{entry.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">{formatCurrency(entry.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 pt-2 mt-2 border-t border-slate-100">
          <span className="text-sm font-medium text-slate-700">Total</span>
          <span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Executive KPI Card
const ExecutiveKPICard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  accentColor = "#1e40af",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  accentColor?: string;
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up": return <ArrowUpRight className="w-4 h-4" />;
      case "down": return <ArrowDownRight className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up": return "text-emerald-600 bg-emerald-50";
      case "down": return "text-red-600 bg-red-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${accentColor}10` }}
        >
          <Icon className="w-6 h-6" style={{ color: accentColor }} />
        </div>
      </div>
      {trend && trendValue && (
        <div className="mt-4 flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", getTrendColor())}>
            {getTrendIcon()}
            {trendValue}
          </span>
          <span className="text-xs text-slate-500">vs previous period</span>
        </div>
      )}
    </div>
  );
};

// Collection Progress Card
const CollectionProgressCard = ({
  title,
  expected,
  collected,
  icon: Icon,
}: {
  title: string;
  expected: number;
  collected: number;
  icon: React.ElementType;
}) => {
  const percentage = expected > 0 ? (collected / expected) * 100 : 0;
  const shortfall = expected - collected;
  const isGood = percentage >= 80;
  const isMedium = percentage >= 60 && percentage < 80;

  const getStatusColor = () => {
    if (isGood) return { bg: "bg-emerald-500", light: "bg-emerald-100", text: "text-emerald-700" };
    if (isMedium) return { bg: "bg-amber-500", light: "bg-amber-100", text: "text-amber-700" };
    return { bg: "bg-red-500", light: "bg-red-100", text: "text-red-700" };
  };

  const status = getStatusColor();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-slate-500" />
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", status.light, status.text)}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="space-y-3">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", status.bg)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-xs text-slate-500 mb-0.5">Expected</p>
            <p className="text-sm font-semibold text-slate-800">{formatIndianNumber(expected).replace("₹", "")}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-xs text-slate-500 mb-0.5">Collected</p>
            <p className="text-sm font-semibold text-slate-800">{formatIndianNumber(collected).replace("₹", "")}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-xs text-slate-500 mb-0.5">Shortfall</p>
            <p className={cn("text-sm font-semibold", shortfall > 0 ? "text-red-600" : "text-emerald-600")}>
              {formatIndianNumber(Math.abs(shortfall)).replace("₹", "")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Revenue Split Donut Chart
const RevenueSplitDonut = ({
  newSales,
  amc,
}: {
  newSales: number;
  amc: number;
}) => {
  const total = newSales + amc;
  const data = [
    { name: "New Sales", value: newSales, color: CHART_COLORS.newSales },
    { name: "AMC Revenue", value: amc, color: CHART_COLORS.amc },
  ];

  const chartConfig: ChartConfig = {
    newSales: { label: "New Sales", color: CHART_COLORS.newSales },
    amc: { label: "AMC Revenue", color: CHART_COLORS.amc },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-slate-800">Revenue Composition</span>
        <span className="text-xs text-slate-500">Current Period</span>
      </div>

      <div className="flex items-center gap-6">
        <ChartContainer config={chartConfig} className="h-[140px] w-[140px]">
          <PieChart width={140} height={140}>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={45}
              outerRadius={65}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox && typeof viewBox.cy === "number") {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy - 8} className="fill-slate-400 text-[10px] font-medium">
                          TOTAL
                        </tspan>
                        <tspan x={viewBox.cx} y={viewBox.cy + 10} className="fill-slate-900 text-sm font-bold">
                          {formatIndianNumber(total).replace("₹", "")}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
            <ChartTooltip
              content={({ payload }) => {
                if (payload && payload.length) {
                  const d = payload[0].payload;
                  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0";
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                      <p className="font-medium text-slate-800 text-sm">{d.name}</p>
                      <p className="text-slate-600 text-sm">{formatCurrency(d.value)}</p>
                      <p className="text-slate-500 text-xs">{pct}% of total</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ChartContainer>

        <div className="flex-1 space-y-3">
          {data.map((item, idx) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
            return (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-800">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Monthly Drilldown Modal
const MonthlyDrilldownModal = ({ period, year, month }: { period: string; year: number; month: number }) => {
  const { data, isLoading } = useGetMonthlyRevenueBreakdownQuery({ year, month });

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-slate-900">{period}</DialogTitle>
        <DialogDescription className="text-sm text-slate-500">
          Detailed revenue breakdown for this period
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <Loading />
      ) : data?.data ? (
        <div className="space-y-6">
          {/* New Sales Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                New Sales
              </h3>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(data.data.newSales.total)}</span>
            </div>
            <div className="bg-slate-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Client</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Product</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.data.newSales.details.length > 0 ? (
                    data.data.newSales.details.map((detail, idx) => (
                      <tr key={idx} className="hover:bg-white transition-colors">
                        <td className="px-4 py-3 text-slate-800">{detail.clientName}</td>
                        <td className="px-4 py-3 text-slate-600">{detail.productName}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(detail.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No new sales in this period</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AMC Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                AMC Revenue
              </h3>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(data.data.amc.total)}</span>
            </div>
            <div className="bg-slate-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Client</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.data.amc.details.length > 0 ? (
                    data.data.amc.details.map((detail, idx) => (
                      <tr key={idx} className="hover:bg-white transition-colors">
                        <td className="px-4 py-3 text-slate-800">{detail.clientName}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                            detail.status?.toLowerCase() === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          )}>
                            {detail.status?.toLowerCase() === "paid" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {detail.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(detail.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">No AMC revenue in this period</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500">No data available</div>
      )}
    </div>
  );
};

// Main Dashboard Component
const RevenueReportDashboard = () => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const defaultFiscalYear = currentMonth < 3 ? currentYear - 1 : currentYear;

  const [fiscalYear, setFiscalYear] = useState<number>(defaultFiscalYear);
  const [selectedPeriod, setSelectedPeriod] = useState<{ period: string; year: number; month: number } | null>(null);

  const revenueFilters: IReportQueries = useMemo(() => ({
    filter: DEFAULT_FILTER,
    options: { year: fiscalYear },
  }), [fiscalYear]);

  const { data: revenueData, isLoading: isRevenueLoading } = useGetRevenueDashboardQuery(revenueFilters);
  const { data: expectedVsCollectedData, isLoading: isExpectedVsCollectedLoading } = useGetExpectedVsCollectedQuery({ fiscalYear });

  const chartRef = useRef<HTMLDivElement | null>(null);

  // Chart data
  const revenueChartData = useMemo(() => {
    return revenueData?.data?.monthlyBreakdown.map((item) => ({
      period: item.period,
      newSalesRevenue: item.newSalesRevenue,
      amcRevenue: item.amcRevenue,
      total: item.totalRevenue,
    })) || [];
  }, [revenueData]);

  const collectionChartData = useMemo(() => {
    if (!expectedVsCollectedData?.data) return [];

    const periodMap = new Map<string, { period: string; expected: number; collected: number }>();
    expectedVsCollectedData.data.newSales.breakdown.forEach((item) => {
      const existing = periodMap.get(item.period) || { period: item.period, expected: 0, collected: 0 };
      existing.expected += item.expected;
      existing.collected += item.collected;
      periodMap.set(item.period, existing);
    });
    expectedVsCollectedData.data.amc.breakdown.forEach((item) => {
      const existing = periodMap.get(item.period) || { period: item.period, expected: 0, collected: 0 };
      existing.expected += item.expected;
      existing.collected += item.collected;
      periodMap.set(item.period, existing);
    });

    return Array.from(periodMap.values());
  }, [expectedVsCollectedData]);

  // Summary calculations
  const summary = useMemo(() => {
    const newSales = revenueData?.data?.summary.totalNewSalesRevenue || 0;
    const amc = revenueData?.data?.summary.totalAMCRevenue || 0;
    const total = newSales + amc;
    const collected = expectedVsCollectedData?.data?.total.collected || 0;
    const expected = expectedVsCollectedData?.data?.total.expected || 0;
    const collectionRate = expected > 0 ? (collected / expected) * 100 : 0;

    return { newSales, amc, total, collected, expected, collectionRate };
  }, [revenueData, expectedVsCollectedData]);

  const handleBarClick = (barData: any) => {
    const period = barData.period;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.findIndex(m => period.includes(m));
    if (monthIndex !== -1) {
      const fyMatch = period.match(/FY\s?(\d{2})-(\d{2})/);
      if (fyMatch) {
        const fyStart = 2000 + parseInt(fyMatch[1]);
        let year = fyStart;
        if (monthIndex < 3) year = fyStart + 1;
        setSelectedPeriod({ period, year, month: monthIndex + 1 });
      }
    }
  };

  const handleDownloadPDF = () => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    html2canvas(chartElement, { scale: 2, backgroundColor: "#f8fafc" }).then((canvas) => {
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const fyLabel = `FY ${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}`;

      // Header
      pdf.setFillColor(30, 64, 175); // Deep blue
      pdf.rect(0, 0, 297, 25, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20).setFont("Helvetica", "", "bold");
      pdf.text("Revenue Report Dashboard", 15, 16);

      pdf.setFontSize(11).setFont("Helvetica", "", "normal");
      pdf.text(`Fiscal Year: ${fyLabel}`, 200, 12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 200, 18);

      // Content
      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 13.5, 30, imgWidth, imgHeight);

      // Footer
      pdf.setFillColor(248, 250, 252);
      pdf.rect(0, 195, 297, 12, "F");
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(8);
      pdf.text("Confidential - For Internal Use Only", 15, 202);
      pdf.text(`Page 1 of 1`, 270, 202);

      pdf.save(`Revenue_Report_${fyLabel.replace(/\s/g, "_")}.pdf`);
    });
  };

  const isLoading = isRevenueLoading || isExpectedVsCollectedLoading;
  const fyLabel = `FY ${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}`;

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Revenue Dashboard</h1>
                  <p className="text-sm text-slate-500">Financial Performance Report</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                <Calendar className="w-4 h-4 text-slate-500" />
                <Select value={fiscalYear.toString()} onValueChange={(v) => setFiscalYear(Number(v))}>
                  <SelectTrigger className="w-[140px] border-0 bg-transparent shadow-none h-8 font-medium">
                    <SelectValue placeholder="Fiscal Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYears().map((y) => (
                      <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleDownloadPDF} className="gap-2 bg-slate-800 hover:bg-slate-900">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={chartRef} className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="py-20"><Loading /></div>
        ) : (
          <>
            {/* Report Meta Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-600">Report Period:</span>
                  <span className="text-sm font-semibold text-slate-800">{fyLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-600">Last Updated:</span>
                  <span className="text-sm font-semibold text-slate-800">{getCurrentPeriod()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Live Data</span>
              </div>
            </div>

            {/* Executive KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <ExecutiveKPICard
                title="Total Revenue"
                value={formatIndianNumber(summary.total)}
                subtitle={formatCurrency(summary.total)}
                icon={DollarSign}
                accentColor="#1e40af"
              />
              <ExecutiveKPICard
                title="New Sales"
                value={formatIndianNumber(summary.newSales)}
                subtitle={formatCurrency(summary.newSales)}
                icon={Building2}
                accentColor="#1e40af"
              />
              <ExecutiveKPICard
                title="AMC Revenue"
                value={formatIndianNumber(summary.amc)}
                subtitle={formatCurrency(summary.amc)}
                icon={Receipt}
                accentColor="#059669"
              />
              <ExecutiveKPICard
                title="Collection Rate"
                value={`${summary.collectionRate.toFixed(1)}%`}
                subtitle={`of ${formatCurrency(summary.expected)}`}
                icon={Target}
                accentColor={summary.collectionRate >= 80 ? "#059669" : summary.collectionRate >= 60 ? "#f59e0b" : "#dc2626"}
              />
            </div>

            {/* Collection Progress Cards */}
            <div className="grid grid-cols-3 gap-4">
              <CollectionProgressCard
                title="New Sales Collection"
                expected={expectedVsCollectedData?.data?.newSales.expected || 0}
                collected={expectedVsCollectedData?.data?.newSales.collected || 0}
                icon={Building2}
              />
              <CollectionProgressCard
                title="AMC Collection"
                expected={expectedVsCollectedData?.data?.amc.expected || 0}
                collected={expectedVsCollectedData?.data?.amc.collected || 0}
                icon={Receipt}
              />
              <RevenueSplitDonut
                newSales={summary.newSales}
                amc={summary.amc}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Revenue Trend Chart */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">Revenue Trend</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Monthly breakdown by source • Click bars for details</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.newSales }} />
                        <span className="text-slate-600">New Sales</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.amc }} />
                        <span className="text-slate-600">AMC</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {revenueChartData.length > 0 ? (
                    <ChartContainer config={revenueChartConfig} className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={revenueChartData} barCategoryGap="20%">
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="period"
                            tickLine={false}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            tickFormatter={(v) => {
                              if (v >= 10000000) return `${(v / 10000000).toFixed(0)}Cr`;
                              if (v >= 100000) return `${(v / 100000).toFixed(0)}L`;
                              if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                              return v;
                            }}
                          />
                          <ChartTooltip content={<ProfessionalTooltip />} />
                          <Bar
                            name="New Sales"
                            dataKey="newSalesRevenue"
                            stackId="a"
                            fill={CHART_COLORS.newSales}
                            radius={[0, 0, 0, 0]}
                            cursor="pointer"
                            onClick={handleBarClick}
                          />
                          <Bar
                            name="AMC Revenue"
                            dataKey="amcRevenue"
                            stackId="a"
                            fill={CHART_COLORS.amc}
                            radius={[4, 4, 0, 0]}
                            cursor="pointer"
                            onClick={handleBarClick}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[320px] flex items-center justify-center text-slate-500">
                      No data available for this period
                    </div>
                  )}
                </div>
              </div>

              {/* Collection Comparison Chart */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">Expected vs Collected</h3>
                      <p className="text-sm text-slate-500 mt-0.5">Monthly collection performance analysis</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.expected }} />
                        <span className="text-slate-600">Expected</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS.collected }} />
                        <span className="text-slate-600">Collected</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {collectionChartData.length > 0 ? (
                    <ChartContainer config={revenueChartConfig} className="h-[320px] w-full">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={collectionChartData} barCategoryGap="25%">
                          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis
                            dataKey="period"
                            tickLine={false}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: "#64748b", fontSize: 11 }}
                            tickFormatter={(v) => {
                              if (v >= 10000000) return `${(v / 10000000).toFixed(0)}Cr`;
                              if (v >= 100000) return `${(v / 100000).toFixed(0)}L`;
                              if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                              return v;
                            }}
                          />
                          <ChartTooltip content={<ProfessionalTooltip type="collection" />} />
                          <Bar
                            name="Expected"
                            dataKey="expected"
                            fill={CHART_COLORS.expected}
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            name="Collected"
                            dataKey="collected"
                            fill={CHART_COLORS.collected}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-[320px] flex items-center justify-center text-slate-500">
                      No data available for this period
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100 rounded-lg text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Click on chart bars to view detailed breakdown</span>
              </div>
              <span>Report generated on {new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}</span>
            </div>
          </>
        )}
      </div>

      {/* Drilldown Modal */}
      <Dialog open={!!selectedPeriod} onOpenChange={() => setSelectedPeriod(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedPeriod && (
            <MonthlyDrilldownModal period={selectedPeriod.period} year={selectedPeriod.year} month={selectedPeriod.month} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Page = () => <RevenueReportDashboard />;

export default Page;
