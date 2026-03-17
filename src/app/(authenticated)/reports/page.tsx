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
} from "recharts";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  useGetRevenueDashboardQuery,
  useGetExpectedVsCollectedQuery,
  useGetMonthlyRevenueBreakdownQuery,
  useGetClientHealthDashboardQuery,
  IReportQueries,
} from "@/redux/api/report";
import { cn, formatCurrency, formatIndianNumber } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Building2,
  Receipt,
  Target,
  DollarSign,
  BarChart3,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Users,
  ShieldAlert,
  Heart,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Layers,
  TrendingUp,
} from "lucide-react";

const DEFAULT_FILTER = "monthly" as const;
const CHART_COLORS = {
  newSales: "#1e40af",
  amc: "#059669",
  expected: "#6366f1",
  collected: "#10b981",
};

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

// Compact KPI Card
const CompactKPICard = ({ title, value, subtitle, icon: Icon, color = "#1e40af" }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color?: string;
}) => (
  <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
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

// Collection Progress
const CompactCollectionProgress = ({ title, expected, collected, icon: Icon }: {
  title: string;
  expected: number;
  collected: number;
  icon: React.ElementType;
}) => {
  const percentage = expected > 0 ? (collected / expected) * 100 : 0;
  const isGood = percentage >= 80;
  const isMedium = percentage >= 60 && percentage < 80;
  const color = isGood ? "bg-emerald-500" : isMedium ? "bg-amber-500" : "bg-red-500";
  const textColor = isGood ? "text-emerald-700" : isMedium ? "text-amber-700" : "text-red-700";

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
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
        <span>Exp: {formatIndianNumber(expected).replace("₹", "")}</span>
        <span>Col: {formatIndianNumber(collected).replace("₹", "")}</span>
      </div>
    </div>
  );
};

// Revenue Donut
const CompactRevenueDonut = ({ newSales, amc }: { newSales: number; amc: number }) => {
  const total = newSales + amc;
  const data = [
    { name: "New Sales", value: newSales, color: CHART_COLORS.newSales },
    { name: "AMC", value: amc, color: CHART_COLORS.amc },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <p className="text-xs font-medium text-slate-700 mb-2">Revenue Split</p>
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

// Status Badge for AMC payments
const StatusBadge = ({ status }: { status: string }) => {
  const statusLower = status?.toLowerCase() || '';
  const variant = statusLower === 'paid' ? 'success' :
                  statusLower === 'pending' ? 'secondary' :
                  'outline';
  return (
    <Badge variant={variant} className="text-[10px] px-1.5 py-0">
      {status || 'Unknown'}
    </Badge>
  );
};

// Monthly Drilldown Modal
const MonthlyDrilldownModal = ({ period, year, month }: { period: string; year: number; month: number }) => {
  const { data, isLoading } = useGetMonthlyRevenueBreakdownQuery({ year, month });

  const renderSection = (
    title: string,
    total: number,
    details: { clientName: string; productName: string; amount: number; status: string }[],
    isAmc: boolean
  ) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          {isAmc ? <Receipt className="w-3.5 h-3.5 text-emerald-600" /> : <Building2 className="w-3.5 h-3.5 text-blue-600" />}
          {title}
        </h3>
        <span className="text-sm font-bold text-slate-900">{formatCurrency(total)}</span>
      </div>
      <div className="bg-slate-50 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Client</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">{isAmc ? "Status" : "Product"}</th>
              <th className="px-3 py-2 text-right font-semibold text-slate-600">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {details.length > 0 ? details.map((detail, idx) => (
              <tr key={idx} className="hover:bg-white">
                <td className="px-3 py-2 text-slate-800">{detail.clientName}</td>
                <td className="px-3 py-2">
                  {isAmc ? <StatusBadge status={detail.status} /> : <span className="text-slate-600">{detail.productName}</span>}
                </td>
                <td className="px-3 py-2 text-right font-medium text-slate-800">{formatCurrency(detail.amount)}</td>
              </tr>
            )) : (
              <tr><td colSpan={3} className="px-3 py-4 text-center text-slate-500">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-bold text-slate-900">{period}</DialogTitle>
        <DialogDescription className="text-xs text-slate-500">Detailed revenue breakdown</DialogDescription>
      </DialogHeader>
      {isLoading ? (
        <Loading />
      ) : data?.data ? (
        <div className="space-y-4">
          {renderSection("New Sales", data.data.newSales.total, data.data.newSales.details, false)}
          {renderSection("AMC Revenue", data.data.amc.total, data.data.amc.details, true)}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500">No data available</div>
      )}
    </div>
  );
};

// Health Score Badge
const HealthScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 80 ? { bg: "bg-emerald-100", text: "text-emerald-700" } :
                score >= 60 ? { bg: "bg-amber-100", text: "text-amber-700" } :
                { bg: "bg-red-100", text: "text-red-700" };
  return (
    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full", color.bg)}>
      <Heart className="w-3 h-3" />
      <span className={cn("text-xs font-bold", color.text)}>{score.toFixed(0)}</span>
    </div>
  );
};

// Compact Client Health Scorecard
const CompactClientHealthScorecard = ({ healthMetrics }: {
  healthMetrics: {
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    activePercentage: number;
    overdueClients: { over30Days: number; over60Days: number; over90Days: number };
    amcRenewalRate: number;
  };
}) => {
  const healthScore = Math.round(
    (healthMetrics.activePercentage * 0.3 +
      healthMetrics.amcRenewalRate * 0.3 +
      Math.max(0, 100 - (healthMetrics.overdueClients.over60Days + healthMetrics.overdueClients.over90Days) * 5) * 0.4)
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-semibold text-slate-900">Client Health</h3>
        </div>
        <HealthScoreBadge score={healthScore} />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="bg-slate-50 rounded p-2 text-center">
          <p className="text-[9px] text-slate-500">Total</p>
          <p className="text-sm font-bold text-slate-900">{healthMetrics.totalClients}</p>
        </div>
        <div className="bg-emerald-50 rounded p-2 text-center">
          <p className="text-[9px] text-emerald-600">Active</p>
          <p className="text-sm font-bold text-emerald-700">{healthMetrics.activeClients}</p>
        </div>
        <div className="bg-slate-50 rounded p-2 text-center">
          <p className="text-[9px] text-slate-500">AMC Renew</p>
          <p className="text-sm font-bold text-slate-900">{healthMetrics.amcRenewalRate.toFixed(0)}%</p>
        </div>
        <div className="bg-red-50 rounded p-2 text-center">
          <p className="text-[9px] text-red-600">90+ Overdue</p>
          <p className="text-sm font-bold text-red-700">{healthMetrics.overdueClients.over90Days}</p>
        </div>
      </div>
    </div>
  );
};

// Compact Client Performers
const CompactClientPerformers = ({ topClients, atRiskClients }: {
  topClients: any[];
  atRiskClients: any[];
}) => {
  const [activeTab, setActiveTab] = useState<"top" | "risk">("top");
  const data = activeTab === "top" ? topClients : atRiskClients;

  const getTrend = (trend: string, pct: number) => {
    if (trend === "up") return <span className="text-emerald-600 text-[10px]">+{pct.toFixed(0)}%</span>;
    if (trend === "down") return <span className="text-red-600 text-[10px]">{pct.toFixed(0)}%</span>;
    return <span className="text-slate-500 text-[10px]">0%</span>;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-900">Client Performance</h3>
        <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded">
          {["top", "risk"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "top" | "risk")}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded transition-colors",
                activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              )}
            >
              {tab === "top" ? "Top" : `At Risk (${atRiskClients.length})`}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto max-h-[140px]">
        {data.length > 0 ? (
          <table className="w-full text-[10px]">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Client</th>
                <th className="px-3 py-1.5 text-right font-semibold text-slate-500">Revenue</th>
                <th className="px-3 py-1.5 text-center font-semibold text-slate-500">Trend</th>
                {activeTab === "risk" && <th className="px-3 py-1.5 text-left font-semibold text-slate-500">Risk</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.slice(0, 5).map((client, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-3 py-1.5 font-medium text-slate-800">{client.clientName}</td>
                  <td className="px-3 py-1.5 text-right text-slate-800">{formatCurrency(client.totalRevenue)}</td>
                  <td className="px-3 py-1.5 text-center">{getTrend(client.trend, client.trendPercentage)}</td>
                  {activeTab === "risk" && (
                    <td className="px-3 py-1.5">
                      <div className="flex flex-wrap gap-0.5">
                        {client.riskFactors?.slice(0, 2).map((f: string, i: number) => (
                          <span key={i} className="px-1 py-0.5 bg-red-50 text-red-700 text-[9px] rounded">{f}</span>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-4 text-center text-slate-500 text-xs">No data</div>
        )}
      </div>
    </div>
  );
};

// Compact Concentration Risk
const CompactConcentrationRisk = ({ concentrationRisk }: {
  concentrationRisk: {
    totalRevenue: number;
    top10ClientsRevenue: number;
    top10Percentage: number;
    herfindahlIndex: number;
    riskLevel: "low" | "medium" | "high";
    industryDiversification: { industry: string; clientCount: number; totalRevenue: number; percentage: number }[];
  };
}) => {
  const riskColor = concentrationRisk.riskLevel === "low" ? { bg: "bg-emerald-100", text: "text-emerald-700" } :
                    concentrationRisk.riskLevel === "medium" ? { bg: "bg-amber-100", text: "text-amber-700" } :
                    { bg: "bg-red-100", text: "text-red-700" };
  const COLORS = ["#1e40af", "#059669", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-purple-500" />
          <h3 className="text-xs font-semibold text-slate-900">Concentration Risk</h3>
        </div>
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", riskColor.bg, riskColor.text)}>
          {concentrationRisk.riskLevel}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <div>
            <div className="flex items-center justify-between mb-1 text-[10px]">
              <span className="text-slate-500">Top 10 Share</span>
              <span className="font-semibold text-slate-800">{concentrationRisk.top10Percentage.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", riskColor.bg)} style={{ width: `${Math.min(concentrationRisk.top10Percentage, 100)}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-50 rounded p-1.5 text-center">
              <p className="text-slate-500">HHI</p>
              <p className="font-bold text-slate-800">{concentrationRisk.herfindahlIndex.toFixed(0)}</p>
            </div>
            <div className="bg-slate-50 rounded p-1.5 text-center">
              <p className="text-slate-500">Industries</p>
              <p className="font-bold text-slate-800">{concentrationRisk.industryDiversification.length}</p>
            </div>
          </div>
        </div>

        <div className="w-[100px]">
          <ChartContainer config={revenueChartConfig} className="h-[80px] w-[80px] mx-auto">
            <PieChart width={80} height={80}>
              <Pie
                data={concentrationRisk.industryDiversification.slice(0, 6)}
                dataKey="percentage"
                nameKey="industry"
                innerRadius={25}
                outerRadius={38}
                paddingAngle={1}
                strokeWidth={0}
              >
                {concentrationRisk.industryDiversification.slice(0, 6).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <p className="text-[9px] text-slate-500 text-center mt-1">By Industry</p>
        </div>
      </div>
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
  const { data: clientHealthData, isLoading: isClientHealthLoading } = useGetClientHealthDashboardQuery({ fiscalYear });

  const chartRef = useRef<HTMLDivElement | null>(null);

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

      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 0, 297, 20, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16).setFont("Helvetica", "", "bold");
      pdf.text("Revenue Report Dashboard", 15, 13);
      pdf.setFontSize(9).setFont("Helvetica", "", "normal");
      pdf.text(`${fyLabel} | ${new Date().toLocaleDateString()}`, 200, 13);

      const imgWidth = 270;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 13.5, 25, imgWidth, imgHeight);

      pdf.save(`Revenue_Report_${fyLabel.replace(/\s/g, "_")}.pdf`);
    });
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
              <Button onClick={handleDownloadPDF} className="gap-1.5 bg-slate-800 hover:bg-slate-900 h-7 text-xs px-3">
                <Download className="w-3 h-3" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Compact Layout */}
      <div ref={chartRef} className="max-w-[1600px] mx-auto px-4 py-3 space-y-3">
        {isLoading ? (
          <div className="py-10"><Loading /></div>
        ) : (
          <>
            {/* Row 1: KPI Cards */}
            <div className="grid grid-cols-6 gap-2">
              <CompactKPICard title="Total Revenue" value={formatIndianNumber(summary.total)} subtitle={formatCurrency(summary.total)} icon={DollarSign} color="#1e40af" />
              <CompactKPICard title="New Sales" value={formatIndianNumber(summary.newSales)} subtitle={formatCurrency(summary.newSales)} icon={Building2} color="#1e40af" />
              <CompactKPICard title="AMC Revenue" value={formatIndianNumber(summary.amc)} subtitle={formatCurrency(summary.amc)} icon={Receipt} color="#059669" />
              <CompactKPICard title="Collection Rate" value={`${summary.collectionRate.toFixed(0)}%`} subtitle={`of ${formatCurrency(summary.expected)}`} icon={Target} color={summary.collectionRate >= 80 ? "#059669" : summary.collectionRate >= 60 ? "#f59e0b" : "#dc2626"} />
              <CompactCollectionProgress title="Sales Collection" expected={expectedVsCollectedData?.data?.newSales.expected || 0} collected={expectedVsCollectedData?.data?.newSales.collected || 0} icon={Building2} />
              <CompactCollectionProgress title="AMC Collection" expected={expectedVsCollectedData?.data?.amc.expected || 0} collected={expectedVsCollectedData?.data?.amc.collected || 0} icon={Receipt} />
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
                  <div className="px-3 py-2 border-b border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-900">Expected vs Collected</h3>
                  </div>
                  <div className="p-2">
                    {collectionChartData.length > 0 ? (
                      <ChartContainer config={revenueChartConfig} className="h-[130px] w-full">
                        <ResponsiveContainer width="100%" height={130}>
                          <BarChart data={collectionChartData} barCategoryGap="20%">
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="period" tickLine={false} axisLine={{ stroke: "#e2e8f0" }} tick={{ fill: "#64748b", fontSize: 8 }} angle={-45} textAnchor="end" height={40} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 8 }} tickFormatter={(v) => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                            <ChartTooltip content={<CompactTooltip />} />
                            <Bar name="Expected" dataKey="expected" fill={CHART_COLORS.expected} radius={[2, 2, 0, 0]} />
                            <Bar name="Collected" dataKey="collected" fill={CHART_COLORS.collected} radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="h-[130px] flex items-center justify-center text-slate-500 text-xs">No data</div>
                    )}
                  </div>
                </div>
                <CompactRevenueDonut newSales={summary.newSales} amc={summary.amc} />
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

                <div className="grid grid-cols-3 gap-3">
                  <CompactClientHealthScorecard healthMetrics={clientHealthData.data.healthMetrics} />
                  <CompactClientPerformers
                    topClients={clientHealthData.data.topPerformers.topClients}
                    atRiskClients={clientHealthData.data.topPerformers.atRiskClients}
                  />
                  <CompactConcentrationRisk concentrationRisk={clientHealthData.data.concentrationRisk} />
                </div>
              </>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded text-[10px] text-slate-500">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Click chart bars for details</span>
              </div>
              <span>Generated: {new Date().toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
            </div>
          </>
        )}
      </div>

      {/* Drilldown Modal */}
      <Dialog open={!!selectedPeriod} onOpenChange={() => setSelectedPeriod(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
