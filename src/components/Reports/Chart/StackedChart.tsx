"use client";

import React, { memo, useMemo } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartLegendContent,
} from "@/components/ui/chart";
import Typography from "@/components/ui/Typography";
import { capitalizeFirstLetter, cn, formatCurrency } from "@/lib/utils";
import Loading from "@/components/ui/loading";

interface MultipleStackedChartProps {
    data: any[];
    isLoading: boolean;
    header: string;
    description: string;
    chartConfigClassName?: string;
}

const CustomTooltip = memo(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const total = payload[0].payload.total;
        return (
            <div className="bg-background p-4 rounded-md shadow-md border border-border">
                <p className="font-bold">{`Industry: `} <span className="capitalize">{label}</span></p>
                <div className="my-1">
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="size-2 rounded-full" style={{ background: entry.color }}>
                            </div>
                            <p>
                                {`${entry.name}: ${formatCurrency(entry.value)}`}
                            </p>
                        </div>
                    ))}
                </div>
                <p className="font-bold">{`Total: ${formatCurrency(total)}`}</p>
            </div>
        );
    }
    return null;
});


const MultipleStackedChart: React.FC<MultipleStackedChartProps> = ({ data, header, description, isLoading, chartConfigClassName }) => {
    const chartConfig = useMemo(() => {
        const config: { [key: string]: { label: string; color: string } } = {};
        const colors = [
            "hsl(var(--chart-1))",
            "hsl(var(--chart-2))",
            "hsl(var(--chart-3))",
            "hsl(var(--chart-4))",
            "hsl(var(--chart-5))",
        ];

        if (data.length > 0) {
            Object.keys(data[0]).forEach((key, index) => {
                if (!['period', 'industry', 'total'].includes(key)) {
                    config[key] = {
                        label: capitalizeFirstLetter(key.replace(/([A-Z])/g, ' $1').trim()),
                        color: colors[index % colors.length],
                    };
                }
            });
        }

        return config;
    }, [data]);

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
                                    <BarChart data={data}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="industry"
                                            tickLine={false}
                                            tick={{ fill: "hsl(var(--foreground))" }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            tick={{ fill: "hsl(var(--foreground))" }}
                                            tickFormatter={(value) => formatCurrency(value)}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend content={<ChartLegendContent />} />
                                        {Object.keys(chartConfig).map((key, index) => (
                                            <Bar
                                                key={key}
                                                dataKey={key}
                                                stackId="a"
                                                fill={chartConfig[key].color}
                                                radius={
                                                    index === Object.keys(chartConfig).length ?
                                                        [4, 4, 0, 0] : [0, 0, 0, 0]}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            : <Typography variant="p" className="text-center">No data available</Typography>
                }
            </CardContent>
        </Card>
    );
};

CustomTooltip.displayName="CustomTooltip";

export default MultipleStackedChart;

