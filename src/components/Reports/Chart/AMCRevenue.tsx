"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
} from "recharts";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
} from "@/components/ui/chart";
import Typography from "@/components/ui/Typography";
import { cn, formatCurrency, formatIndianNumber } from "@/lib/utils";
import Loading from "@/components/ui/loading";
import { IAMCAnnualBreakDown } from "@/redux/api/report";

interface MultipleStackedChartProps {
    data: IAMCAnnualBreakDown[];
    isLoading: boolean;
    header: string;
    description: string;
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
                            <p className="text-xs text-muted-foreground">Total Expected</p>
                            <p className="text-sm font-medium">{formatCurrency(payload[0].value)}</p>
                            <p className="text-xs text-muted-foreground">({formatIndianNumber(payload[0].value)})</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="bg-chart-2 rounded-sm size-2"></div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Collected</p>
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

const AMCRevenue: React.FC<MultipleStackedChartProps> = ({ data, header, description, isLoading, chartConfigClassName }) => {
    const chartConfig = {
        totalExpected: {
            label: "Total Expected",
            color: "hsl(var(--chart-1))",
        },
        totalCollected: {
            label: "Total Collected",
            color: "hsl(var(--chart-2))",
        },
    } satisfies ChartConfig

    return (
        <Card className="w-1/3 flex-1">
            <CardHeader >
                <Typography variant="h2" className="font-bold">
                    {header}
                </Typography>
                <Typography variant="p" className="text-xs !text-gray-500">
                    {description}
                </Typography>
            </CardHeader>
            <CardContent className="px-6">
                {
                    isLoading ?
                        <Loading /> : data.length ?
                            <ChartContainer
                                config={chartConfig}
                                className={cn("h-[200px] w-full mt-4", chartConfigClassName)}
                            >
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart accessibilityLayer data={data}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey="period"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            tickFormatter={(value) => value.slice(0, 3)}
                                        />
                                        <ChartTooltip content={<CustomTooltip />} />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar
                                            dataKey="totalExpected"
                                            stackId="a"
                                            fill="hsl(var(--chart-1))"
                                            radius={[0, 0, 4, 4]}
                                        />
                                        <Bar
                                            dataKey="totalCollected"
                                            stackId="a"
                                            fill="hsl(var(--chart-2))"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            : <Typography variant="p" className="text-center">No data available</Typography>
                }
            </CardContent>
        </Card>
    );
};

export default AMCRevenue;

