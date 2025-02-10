"use client"

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
} from "@/components/ui/chart";
import Typography from "@/components/ui/Typography";
import Loading from "@/components/ui/loading";
import { cn, formatCurrency, formatIndianNumber } from "@/lib/utils";

const chartConfig = {
    area1: {
        label: "First Metric",
        color: "hsl(var(--chart-1))",
    },
    area2: {
        label: "Second Metric",
        color: "hsl(var(--chart-2))",
    },
};

interface DoubleAreaChartProps {
    data: Array<{
        period: string;
        value1: number;
        value2: number;
    }>;
    isLoading: boolean;
    header: string;
    description: string;
    area1Label: string;
    area2Label: string;
    chartConfigClassName?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded p-2 shadow-md">
                <p className="font-bold mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-chart-2 rounded-sm size-2"></div>
                        <div>
                            <p className="text-xs text-muted-foreground">{payload[0].name}</p>
                            <p className="text-sm font-medium">{formatCurrency(payload[0].value)}</p>
                            <p className="text-xs text-muted-foreground">({formatIndianNumber(payload[0].value)})</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-chart-1 rounded-sm size-2"></div>
                        <div>
                            <p className="text-xs text-muted-foreground">{payload[1].name}</p>
                            <p className="text-sm font-medium">{formatCurrency(payload[1].value)}</p>
                            <p className="text-xs text-muted-foreground">({formatIndianNumber(payload[1].value)})</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const DoubleAreaChart: React.FC<DoubleAreaChartProps> = ({
    data,
    isLoading,
    header,
    description,
    area1Label,
    area2Label,
    chartConfigClassName
}) => {
    return (
        <Card className="flex-1 w-1/3">
            <CardHeader>
                <Typography variant="h2" className="font-bold">
                    {header}
                </Typography>
                <Typography variant="p" className="text-xs !text-gray-500">
                    {description}
                </Typography>
            </CardHeader>
            <CardContent className="px-6">
                {isLoading ? (
                    <Loading />
                ) : data?.length ? (
                    <ChartContainer
                        config={chartConfig}
                        className={cn("h-[200px] w-full mt-4", chartConfigClassName)}
                    >
                        <ResponsiveContainer width="100%" height={400}>
                            <AreaChart data={data}
                                margin={{
                                    left: 12,
                                    right: 12,
                                }}>
                                <defs>
                                    <linearGradient id="fillArea1" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="fillArea2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="period"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "hsl(var(--foreground))" }}
                                    tickMargin={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "hsl(var(--foreground))" }}
                                    tickFormatter={(value) => formatIndianNumber(value).replace('₹', '')}
                                    width={60}
                                />
                                <Legend />
                                <Area
                                    name={area1Label}
                                    type="natural"
                                    dataKey="value1"
                                    stroke="hsl(var(--chart-2))"
                                    fill="url(#fillArea2)"
                                    fillOpacity={0.4}
                                />
                                <Area
                                    name={area2Label}
                                    type="natural"
                                    dataKey="value2"
                                    stroke="hsl(var(--chart-1))"
                                    fill="url(#fillArea1)"
                                    fillOpacity={0.4}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<CustomTooltip />}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <CardDescription className="text-center">No data available</CardDescription>
                )}
            </CardContent>
        </Card>
    );
};

export default DoubleAreaChart;