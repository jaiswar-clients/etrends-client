"use client"

import { Bar, Line, XAxis, YAxis, CartesianGrid, Legend, ComposedChart, ResponsiveContainer, Label } from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import Typography from "@/components/ui/Typography"
import Loading from "@/components/ui/loading"
import { cn, formatIndianNumber } from "@/lib/utils"

const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <div className="flex justify-center items-center gap-4">
            {payload.map((entry: { dataKey: string; color: string }, index: number) => (
                <div key={`item-${index}`} className="flex items-center gap-2">
                    <div
                        className="w-3 h-3"
                        style={{
                            backgroundColor: entry.dataKey === 'revenue' ? 'hsl(var(--chart-1))' : 'var(--color-cumulativePercentage)',
                            borderRadius: entry.dataKey === 'revenue' ? '2px' : '0'
                        }}
                    />
                    <span>
                        {entry.dataKey === 'revenue' ? 'Revenue' : 'Cumulative Percentage'}
                    </span>
                </div>
            ))}
        </div>
    );
}

interface ParetoChartProps {
    data: { name: string; revenue: number; cumulativePercentage: number }[];
    isLoading: boolean;
    header: string;
    description: string;
    chartConfigClassName?: string;
}

const ParetoChart: React.FC<ParetoChartProps> = ({
    data,
    isLoading,
    header,
    description,
    chartConfigClassName
}) => {
    return (
        <Card className="w-1/2">
            <CardHeader className="justify-between flex-row">
                <div>
                    <Typography variant="h2" className=" font-bold">
                        {header}
                    </Typography>
                    <Typography variant="p" className="text-xs !text-gray-500">
                        {description}
                    </Typography>
                </div>
            </CardHeader>
            <CardContent>
                {
                    isLoading ?
                        <Loading /> : data.length ?
                            <ChartContainer
                                config={{
                                    revenue: {
                                        label: "Revenue",
                                        color: "hsl(var(--chart-1))",
                                    },
                                    cumulativePercentage: {
                                        label: "Cumulative %",
                                        color: "hsl(var(--chart-2))",
                                    },
                                }}
                                className={cn(`h-[300px] w-full mt-4`, chartConfigClassName)}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={data} margin={{ top: 20, right: 50, left: 50, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis
                                            yAxisId="left"
                                            orientation="left"
                                            stroke="var(--color-revenue)"
                                            tickFormatter={(value) => formatIndianNumber(value).replace('₹', '')}
                                            width={60}
                                        >
                                            <Label value="Revenue" angle={-90} position="insideLeft" offset={-35} style={{ textAnchor: 'middle' }} />
                                        </YAxis>
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="var(--color-cumulativePercentage)"
                                            tickFormatter={(value) => `${value}%`}
                                            width={40}
                                        >
                                            <Label value="Cumulative %" angle={90} position="insideRight" offset={-30} style={{ textAnchor: 'middle' }} />
                                        </YAxis>
                                        <ChartTooltip content={<CustomTooltip />} />
                                        <Legend content={renderLegend} />
                                        <Bar dataKey="revenue" fill="hsl(var(--chart-1))" yAxisId="left" radius={[4, 4, 0, 0]} />
                                        <Line type="monotone" dataKey="cumulativePercentage" stroke="var(--color-cumulativePercentage)" yAxisId="right" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                            :
                            <Typography variant="p" className="text-center text-lg text-gray-500">No data available</Typography>
                }
            </CardContent>
        </Card>
    )
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background border rounded p-2 shadow-md">
                <p className="font-bold">{`${label}`}</p>
                <div className="flex items-center gap-1">
                    <div className="bg-chart-1 rounded-sm size-2"></div>
                    <p className="text-revenue">{`Revenue: ₹${payload[0].value.toLocaleString()}`}</p>
                </div>
                <div className="flex items-center gap-1">
                    <div className="bg-chart-2 rounded-sm size-2"></div>
                    <p className="text-cumulativePercentage">{`Cumulative %: ${payload[1].value.toFixed(2)}%`}</p>
                </div>
            </div>
        );
    }
    return null;
};

export default ParetoChart;
