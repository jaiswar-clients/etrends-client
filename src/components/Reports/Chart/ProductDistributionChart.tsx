"use client"

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import BaseChart from './BaseChart'
import { formatIndianNumber } from '@/lib/utils'
import type { ProductWiseDistribution } from '@/redux/api/report'

interface ProductDistributionChartProps {
  data: ProductWiseDistribution[]
  isLoading?: boolean
  onClick?: () => void
  className?: string
}

const ProductDistributionChart: React.FC<ProductDistributionChartProps> = ({
  data,
  isLoading = false,
  onClick,
  className
}) => {
  // Sort by revenue descending and take top 3
  const topProducts = [...data]
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      // Calculate percentage of total for these top 3
      percentageOfTotal: (item.revenue || 0) / 
        (data.reduce((sum, item) => sum + (item.revenue || 0), 0) || 1) * 100
    }));

  // Calculate "Others" percentage
  const top3Revenue = topProducts.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const othersPercentage = totalRevenue > 0 ? ((totalRevenue - top3Revenue) / totalRevenue) * 100 : 0;

  return (
    <BaseChart
      title="Top Products by Revenue"
      description={`Top 3 products represent ${(top3Revenue / totalRevenue * 100).toFixed(0)}% of total revenue`}
      isLoading={isLoading}
      onClick={onClick}
      className={className}
    >
      <ResponsiveContainer>
        <BarChart
          data={topProducts}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <XAxis dataKey="productName" tickLine={false} />
          <YAxis 
            tickLine={false} 
            domain={[0, 'dataMax']}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            labelFormatter={(value) => `${value}%`}
            formatter={(value, name) => `${formatIndianNumber(
              data.find(item => item.productName === name)?.revenue || 0
            )}`}
          />
          <Bar 
            dataKey="percentageOfTotal" 
            fill="var(--chart-1)" 
            radius={6} 
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      {!isLoading && (
        <div className="mt-4 flex flex-col space-x-2 space-y-2">
          {topProducts.map((product, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: `var(--chart-${index + 1})` }}></div>
              <span>{product.productName}</span>
              <span className="ml-auto font-mono">{product.percentageOfTotal.toFixed(1)}%</span>
            </div>
          ))}
          {othersPercentage > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="h-3 w-3 rounded" style={{ backgroundColor: 'hsl(220, 70%, 50%)' }}></div>
              <span>Others</span>
              <span className="ml-auto font-mono">{othersPercentage.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
    </BaseChart>
  )
}

export default ProductDistributionChart
