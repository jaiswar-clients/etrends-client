"use client";

import * as React from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
} from "@/components/ui/chart";
import {
    PieChart,
    Pie,
    Cell,
    Label
} from "recharts";
import { formatCurrency, formatIndianNumber } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface IProps {
    data: { [key: string]: number };
    title: string;
    valueToDisplay: string; // The key whose value will be displayed in the center
    footerText?: React.ReactNode;
}

const RadialChart = ({ data, title, valueToDisplay, footerText }: IProps) => {
    // Dynamically create chart data and config
    const chartData = Object.keys(data).map((key, index) => ({
        name: key.replace(/_/g, " "),
        value: data[key],
        fill: `hsl(var(--chart-${index + 1}))`,
    }));

    const chartConfig: ChartConfig = Object.fromEntries(
        Object.keys(data).map((key, index) => [
            key.replace(/_/g, " "),
            {
                label: key.replace(/_/g, " "),
                color: `hsl(var(--chart-${index + 1}))`,
            },
        ])
    );

    return (
        <Card className="w-full">
            <CardHeader className="items-center pb-0">
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="h-[200px] mt-2 mx-auto"
                >
                    <PieChart width={200} height={200}>
                        <Pie
                            data={chartData}
                            dataKey="value"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox && typeof viewBox.cy === "number") {
                                        const amount = data[valueToDisplay];
                                        const formattedAmount = formatIndianNumber(amount);

                                        return (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <text
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                            className="cursor-pointer"
                                                        >
                                                            <tspan
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                className="fill-foreground text-sm font-bold"
                                                            >
                                                                {formattedAmount}
                                                            </tspan>
                                                        </text>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{formatCurrency(amount)}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )
                                    }
                                    return null;
                                }}
                            />
                        </Pie>
                        <ChartTooltip
                            content={({ payload }) => {
                                if (payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-background border border-border p-2 rounded-md shadow-md">
                                            <p className="font-medium capitalize !text-xs">{data.name}</p>
                                            <p>{formatCurrency(data.value)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ChartContainer>
                {
                    footerText && (
                        <CardFooter className="text-xs text-muted-foreground">
                            {footerText}
                        </CardFooter>
                    )
                }
            </CardContent>
        </Card>
    );
};

export default RadialChart;
