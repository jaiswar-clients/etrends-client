"use client"

import React, { useState, useMemo, useRef } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
  Cell,
  Pie,
  PieChart,
  Label,
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
  ChartLegendContent,
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
} from "@/components/ui/dialog";
import {
  useGetRevenueDashboardQuery,
  useGetExpectedVsCollectedQuery,
  useGetMonthlyRevenueBreakdownQuery,
  IReportQueries,
} from "@/redux/api/report";
import { cn, formatCurrency, formatIndianNumber, capitalizeFirstLetter } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Helper functions
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const fiscalYears = [];
  const currentMonth = new Date().getMonth();
  const fiscalYearStart = currentMonth < 3 ? currentYear - 1 : currentYear;

  for (let i = fiscalYearStart; i >= fiscalYearStart - 15; i--) {
    const endYear = i + 1;
    const label = `FY${(i % 100).toString().padStart(2, "0")}-${(endYear % 100).toString().padStart(2, "0")}`;
    fiscalYears.push({ label, value: i.toString() });
  }
  return fiscalYears;
};

// Fixed filter - always show monthly breakdown
const DEFAULT_FILTER = "monthly" as const;

// Chart Configs
const revenueChartConfig = {
  newSalesRevenue: { label: "New Sales", color: "hsl(var(--chart-1))" },
  amcRevenue: { label: "AMC Revenue", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const expectedVsCollectedChartConfig = {
  expected: { label: "Expected", color: "hsl(var(--chart-3))" },
  collected: { label: "Collected", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

// Custom Tooltips
const RevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded p-3 shadow-md">
        <p className="font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="size-2 rounded-sm" style={{ background: entry.color }} />
            <span className="text-sm text-muted-foreground">{entry.name}:</span>
            <span className="text-sm font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
        <div className="border-t mt-2 pt-2">
          <span className="text-sm font-bold">
            Total: {formatCurrency(payload.reduce((sum: number, p: any) => sum + p.value, 0))}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const ExpectedVsCollectedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded p-3 shadow-md">
        <p className="font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="size-2 rounded-sm" style={{ background: entry.color }} />
            <span className="text-sm text-muted-foreground">{entry.name}:</span>
            <span className="text-sm font-medium">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Radial Chart Component
const RevenueRadialChart = ({
  data,
  title,
  valueToDisplay,
}: {
  data: { [key: string]: number };
  title: string;
  valueToDisplay: string;
}) => {
  const chartData = Object.keys(data).map((key, index) => ({
    name: key.replace(/_/g, " "),
    value: data[key],
    fill: `hsl(var(--chart-${index + 1}))`,
  }));

  const radialChartConfig: ChartConfig = Object.fromEntries(
    Object.keys(data).map((key, index) => [
      key.replace(/_/g, " "),
      { label: key.replace(/_/g, " "), color: `hsl(var(--chart-${index + 1}))` },
    ])
  );

  return (
    <Card className="w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={radialChartConfig} className="h-[180px] mx-auto">
          <PieChart width={180} height={180}>
            <Pie data={chartData} dataKey="value" innerRadius={35} outerRadius={70} paddingAngle={2}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox && typeof viewBox.cy === "number") {
                    const amount = data[valueToDisplay] || 0;
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xs font-bold">
                          {formatIndianNumber(amount)}
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
                  return (
                    <div className="bg-background border p-2 rounded-md shadow-md">
                      <p className="font-medium capitalize text-xs">{d.name}</p>
                      <p>{formatCurrency(d.value)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

// Progress Bar Component
const CollectionProgressBar = ({ expected, collected, label }: { expected: number; collected: number; label: string }) => {
  const percentage = expected > 0 ? (collected / expected) * 100 : 0;
  const isGood = percentage >= 70;
  const isMedium = percentage >= 50 && percentage < 70;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", isGood && "bg-green-500", isMedium && "bg-yellow-500", !isGood && !isMedium && "bg-red-500")}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Exp: {formatCurrency(expected)}</span>
        <span>Col: {formatCurrency(collected)}</span>
      </div>
    </div>
  );
};

// Monthly Drilldown Modal
const MonthlyDrilldownModal = ({ period, year, month }: { period: string; year: number; month: number }) => {
  const { data, isLoading } = useGetMonthlyRevenueBreakdownQuery({ year, month });

  return (
    <div className="space-y-4">
      <Typography variant="h3" className="font-bold">{period} - Revenue Breakdown</Typography>
      {isLoading ? (
        <Loading />
      ) : data?.data ? (
        <div className="space-y-6">
          <div>
            <Typography variant="h4" className="font-semibold mb-2">
              New Sales: {formatCurrency(data.data.newSales.total)}
            </Typography>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Client</th>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.newSales.details.map((detail, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{detail.clientName}</td>
                      <td className="p-2">{detail.productName}</td>
                      <td className="p-2 text-right">{formatCurrency(detail.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <Typography variant="h4" className="font-semibold mb-2">
              AMC Revenue: {formatCurrency(data.data.amc.total)}
            </Typography>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Client</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.amc.details.map((detail, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{detail.clientName}</td>
                      <td className="p-2 capitalize">{detail.status}</td>
                      <td className="p-2 text-right">{formatCurrency(detail.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <Typography variant="p">No data available</Typography>
      )}
    </div>
  );
};

// Main Consolidated Revenue Dashboard
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

  // Revenue chart data
  const revenueChartData = useMemo(() => {
    return revenueData?.data?.monthlyBreakdown.map((item) => ({
      period: item.period,
      newSalesRevenue: item.newSalesRevenue,
      amcRevenue: item.amcRevenue,
    })) || [];
  }, [revenueData]);

  const revenueRadialData = useMemo(() => {
    if (!revenueData?.data?.summary) return {};
    return {
      newSalesRevenue: revenueData.data.summary.totalNewSalesRevenue,
      amcRevenue: revenueData.data.summary.totalAMCRevenue,
    };
  }, [revenueData]);

  // Expected vs Collected chart data
  const expectedVsCollectedChartData = useMemo(() => {
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

  const handleBarClick = (barData: any) => {
    const period = barData.period;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.findIndex(m => period.includes(m));
    if (monthIndex !== -1) {
      const fyMatch = period.match(/FY(\d{2})-(\d{2})/);
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

    html2canvas(chartElement, { scale: 2 }).then((canvas) => {
      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const fyLabel = `FY${(fiscalYear % 100).toString().padStart(2, "0")}-${((fiscalYear + 1) % 100).toString().padStart(2, "0")}`;

      pdf.setFontSize(18).setFont("Helvetica", "", "bold");
      pdf.text("Revenue Report Dashboard", 10, 10);
      pdf.setFontSize(12);
      pdf.text(`Fiscal Year: ${fyLabel}`, 10, 18);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 26);

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 34, imgWidth, imgHeight);

      pdf.save(`Revenue Report ${fyLabel}.pdf`);
    });
  };

  const isLoading = isRevenueLoading || isExpectedVsCollectedLoading;

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Select value={fiscalYear.toString()} onValueChange={(v) => setFiscalYear(Number(v))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Fiscal Year" />
            </SelectTrigger>
            <SelectContent>
              {generateYears().map((y) => (
                <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleDownloadPDF}>Export PDF</Button>
      </div>

      {/* Main Content */}
      <div ref={chartRef}>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {/* Summary Cards Row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total New Sales</CardDescription>
                  <CardTitle className="text-xl">
                    {formatIndianNumber(revenueData?.data?.summary.totalNewSalesRevenue || 0)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(revenueData?.data?.summary.totalNewSalesRevenue || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total AMC Revenue</CardDescription>
                  <CardTitle className="text-xl">
                    {formatIndianNumber(revenueData?.data?.summary.totalAMCRevenue || 0)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(revenueData?.data?.summary.totalAMCRevenue || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Grand Total</CardDescription>
                  <CardTitle className="text-xl">
                    {formatIndianNumber(revenueData?.data?.summary.grandTotalRevenue || 0)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(revenueData?.data?.summary.grandTotalRevenue || 0)}
                  </p>
                </CardContent>
              </Card>
              <RevenueRadialChart
                data={revenueRadialData}
                title="Revenue Split"
                valueToDisplay="newSalesRevenue"
              />
            </div>

            {/* Collection Progress Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">New Sales Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <CollectionProgressBar
                    expected={expectedVsCollectedData?.data?.newSales.expected || 0}
                    collected={expectedVsCollectedData?.data?.newSales.collected || 0}
                    label="New Sales"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">AMC Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <CollectionProgressBar
                    expected={expectedVsCollectedData?.data?.amc.expected || 0}
                    collected={expectedVsCollectedData?.data?.amc.collected || 0}
                    label="AMC"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Overall Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <CollectionProgressBar
                    expected={expectedVsCollectedData?.data?.total.expected || 0}
                    collected={expectedVsCollectedData?.data?.total.collected || 0}
                    label="Total"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Revenue Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Click on bars to see details</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueChartData.length > 0 ? (
                    <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueChartData}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            tickLine={false}
                            tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            tick={{ fill: "hsl(var(--foreground))" }}
                            tickFormatter={(v) => formatIndianNumber(v).replace("₹", "")}
                          />
                          <ChartTooltip content={<RevenueTooltip />} />
                          <Legend content={<ChartLegendContent />} />
                          <Bar name="New Sales" dataKey="newSalesRevenue" stackId="a" fill="hsl(var(--chart-1))" cursor="pointer" onClick={handleBarClick} />
                          <Bar name="AMC Revenue" dataKey="amcRevenue" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleBarClick} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <Typography variant="p" className="text-center py-8">No data available</Typography>
                  )}
                </CardContent>
              </Card>

              {/* Expected vs Collected Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Expected vs Collected</CardTitle>
                  <CardDescription>Monthly collection comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  {expectedVsCollectedChartData.length > 0 ? (
                    <ChartContainer config={expectedVsCollectedChartConfig} className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={expectedVsCollectedChartData}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="period"
                            tickLine={false}
                            tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            tick={{ fill: "hsl(var(--foreground))" }}
                            tickFormatter={(v) => formatIndianNumber(v).replace("₹", "")}
                          />
                          <ChartTooltip content={<ExpectedVsCollectedTooltip />} />
                          <Legend content={<ChartLegendContent />} />
                          <Bar name="Expected" dataKey="expected" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                          <Bar name="Collected" dataKey="collected" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <Typography variant="p" className="text-center py-8">No data available</Typography>
                  )}
                </CardContent>
              </Card>
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

const Page = () => {
  return <RevenueReportDashboard />;
};

export default Page;