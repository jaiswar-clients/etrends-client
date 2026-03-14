"use client"

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import BaseChart from './BaseChart'
import { formatIndianNumber } from '@/lib/utils'
import type { ProductWiseDistribution } from '@/redux/api/report'

interface ProductDistributionChartProps {
  data: ProductWiseDistribution[]
  isLoading?: boolean
  onClick?: () => void
  className?: string
}

// Color palette using CSS variables
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
]

interface CustomLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  productName: string
}

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  productName
}: CustomLabelProps) => {
  if (percent < 0.05) return null // Don't show label for small slices

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: ProductWiseDistribution
  }>
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="font-medium text-sm">{data.productName}</p>
      <p className="text-muted-foreground text-xs mt-1">
        Revenue: <span className="font-mono font-medium text-foreground">
          {formatIndianNumber(data.revenue)}
        </span>
      </p>
      <p className="text-muted-foreground text-xs">
        Share: <span className="font-medium text-foreground">
          {data.percentage.toFixed(1)}%
        </span>
      </p>
    </div>
  )
}

const ProductDistributionChart: React.FC<ProductDistributionChartProps> = ({
  data,
  isLoading = false,
  onClick,
  className
}) => {
  // Transform data for the chart
  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <BaseChart
      title="Product Distribution"
      description="Revenue distribution by product"
      isLoading={isLoading}
      onClick={onClick}
      className={className}
    >
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="h-[280px] w-full md:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={110}
                dataKey="revenue"
                nameKey="productName"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full md:w-1/2 space-y-2">
          {chartData.slice(0, 6).map((item, index) => (
            <div
              key={item.productId || index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="truncate max-w-[120px]">{item.productName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">
                  {formatIndianNumber(item.revenue)}
                </span>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
          {chartData.length > 6 && (
            <p className="text-xs text-muted-foreground pt-1">
              +{chartData.length - 6} more products
            </p>
          )}
        </div>
      </div>
    </BaseChart>
  )
}

export default ProductDistributionChart
