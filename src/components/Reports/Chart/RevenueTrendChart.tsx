"use client"

import React from 'react'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import {
  ChartContainer
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
  // Calculate total billing for each data point (newBusiness + amc)
  const dataWithTotal = data.map((point) => ({
    ...point,
    totalBilling: (point.newBusiness || 0) + (point.amc || 0)
  }));

  // Calculate trend direction (up/down/neutral) based on first and last data points
  const getTrendDirection = (dataWithTotal: Array<BillingTrend & { totalBilling: number }>): 'up' | 'down' | 'neutral' => {
    if (dataWithTotal.length < 2) return 'neutral'
    const firstValue = dataWithTotal[0]?.totalBilling || 0
    const lastValue = dataWithTotal[dataWithTotal.length - 1]?.totalBilling || 0
    if (lastValue > firstValue * 1.05) return 'up' // 5% threshold for upward trend
    if (lastValue < firstValue * 0.95) return 'down' // 5% threshold for downward trend
    return 'neutral'
  }

  const trendDirection = getTrendDirection(dataWithTotal)
  const trendLabel = trendDirection === 'up' ? 'Increasing' : trendDirection === 'down' ? 'Decreasing' : 'Stable'
  const trendColor = trendDirection === 'up' ? 'text-success' : trendDirection === 'down' ? 'text-destructive' : 'text-muted'

  return (
    <BaseChart
      title="Revenue Trend"
      description={`Total revenue is ${trendLabel.toLowerCase()} over the selected period`}
      isLoading={isLoading}
      onClick={onClick}
      className={className}
    >
      <ChartContainer config={{}} className="h-[300px] w-full">
        <LineChart
          data={dataWithTotal}
          margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              // Format period for better readability (e.g., "Jan 2024" -> "Jan")
              return value.toString().split(' ')[0]
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatYAxisValue}
          />
          <Tooltip
            cursor={false}
            labelFormatter={(value) => `₹${formatIndianNumber(Number(value))}`}
          />
          <Line
            type="monotone"
            dataKey="totalBilling"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </LineChart>
      </ChartContainer>
      {/* Trend indicator */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <span className="text-sm font-medium">Trend:</span>
        <span className={`text-sm font-semibold ${trendColor}`}>
          {trendLabel}
        </span>
      </div>
    </BaseChart>
  )
}

export default RevenueTrendChart
