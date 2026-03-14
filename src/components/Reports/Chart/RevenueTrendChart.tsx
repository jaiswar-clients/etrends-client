"use client"

import React from 'react'
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart'
import BaseChart from './BaseChart'
import { formatIndianNumber } from '@/lib/utils'
import type { BillingTrend } from '@/redux/api/report'

interface RevenueTrendChartProps {
  data: BillingTrend[]
  isLoading?: boolean
  onClick?: () => void
  className?: string
}

const chartConfig = {
  newBusiness: {
    label: "New Business",
    color: "hsl(var(--chart-1))",
  },
  amc: {
    label: "AMC",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const formatYAxisValue = (value: number): string => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}K`
  }
  return `₹${value}`
}

const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({
  data,
  isLoading = false,
  onClick,
  className
}) => {
  return (
    <BaseChart
      title="Revenue Trend"
      description="New Business vs AMC revenue over time"
      isLoading={isLoading}
      onClick={onClick}
      className={className}
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart
          accessibilityLayer
          data={data}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 7)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatYAxisValue}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name) => (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{name}:</span>
                    <span className="font-mono font-medium">
                      {formatIndianNumber(value as number)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Area
            dataKey="newBusiness"
            type="natural"
            fill="var(--color-newBusiness)"
            fillOpacity={0.4}
            stroke="var(--color-newBusiness)"
            stackId="a"
          />
          <Area
            dataKey="amc"
            type="natural"
            fill="var(--color-amc)"
            fillOpacity={0.4}
            stroke="var(--color-amc)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </BaseChart>
  )
}

export default RevenueTrendChart
