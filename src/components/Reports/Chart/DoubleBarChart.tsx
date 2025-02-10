"use client"

import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
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
    bar1: {
        label: "First Metric",
        color: "hsl(var(--primary))",
    },
    bar2: {
        label: "Second Metric",
        color: "hsl(var(--secondary))",
    },
};

interface DoubleBarChartProps {
    data: Array<{
        period: string;
        value1: number;
        value2: number;
    }>;
    isLoading: boolean;
    header: string;
    description: string;
    bar1Label: string;
    bar2Label: string;
    chartConfigClassName?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded p-2 shadow-md">
                <p className="font-bold mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-chart-1 rounded-sm size-2"></div>
                        <div>
                            <p className="text-xs text-muted-foreground">{payload[0].name}</p>
                            <p className="text-sm font-medium">{formatCurrency(payload[0].value)}</p>
                            <p className="text-xs text-muted-foreground">({formatIndianNumber(payload[0].value)})</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-chart-2 rounded-sm size-2"></div>
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

const DoubleBarChart: React.FC<DoubleBarChartProps> = ({
    data,
    isLoading,
    header,
    description,
    bar1Label,
    bar2Label,
    chartConfigClassName
}) => {
    return (
        <Card className="w-1/2">
            <CardHeader>
                <Typography variant="h2" className=" font-bold">
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
                        className={cn(`h-[300px] w-full mt-4`, chartConfigClassName)}
                    >
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={data}>
                                <XAxis
                                    dataKey="period"
                                    axisLine={true}
                                    tickLine={false}
                                    tick={{ fill: "hsl(var(--foreground))" }}
                                />
                                <YAxis
                                    axisLine={true}
                                    tickLine={true}
                                    tick={{ fill: "hsl(var(--foreground))" }}
                                    tickFormatter={(value) => formatIndianNumber(value).replace('₹', '')}
                                    width={60}
                                />
                                <Legend />
                                <Bar
                                    name={bar1Label}
                                    dataKey="value1"
                                    fill="hsl(var(--chart-1))"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    name={bar2Label}
                                    dataKey="value2"
                                    fill="hsl(var(--chart-2))"
                                    radius={[4, 4, 0, 0]}
                                />
                                <ChartTooltip
                                    cursor={{
                                        fill: "var(--primary-foreground)",
                                        opacity: 0.1,
                                    }}
                                    content={<CustomTooltip />}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                ) : (
                    <CardDescription className="text-center">No data available</CardDescription>
                )}
            </CardContent>
        </Card>
    );
};

export default DoubleBarChart;