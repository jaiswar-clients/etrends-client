"use client"

import React from 'react'
import { cn, formatIndianNumber } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, ArrowDown, Minus, type LucideIcon } from 'lucide-react'

export interface KPICardProps {
  title: string
  value: number
  previousValue?: number
  trend?: 'up' | 'down' | 'neutral'
  percentage?: number
  icon?: LucideIcon
  onClick?: () => void
  isLoading?: boolean
  className?: string
  formatValue?: 'currency' | 'number' | 'percentage'
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  previousValue,
  trend,
  percentage,
  icon: Icon,
  onClick,
  isLoading = false,
  className,
  formatValue = 'currency'
}) => {
  // Calculate trend from previousValue if not provided
  const calculatedTrend = trend || (previousValue !== undefined
    ? value > previousValue
      ? 'up'
      : value < previousValue
        ? 'down'
        : 'neutral'
    : 'neutral')

  // Calculate percentage change if not provided but previousValue exists
  const calculatedPercentage = percentage || (previousValue !== undefined && previousValue !== 0
    ? Math.abs(((value - previousValue) / previousValue) * 100)
    : 0)

  const formatDisplayValue = (val: number): string => {
    switch (formatValue) {
      case 'currency':
        return formatIndianNumber(val)
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'number':
      default:
        return val.toLocaleString('en-IN')
    }
  }

  const TrendIcon = calculatedTrend === 'up'
    ? ArrowUp
    : calculatedTrend === 'down'
      ? ArrowDown
      : Minus

  const trendColor = calculatedTrend === 'up'
    ? 'text-green-600'
    : calculatedTrend === 'down'
      ? 'text-red-600'
      : 'text-gray-500'

  if (isLoading) {
    return (
      <Card className={cn("rounded-xl border bg-card shadow-sm", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "rounded-xl border bg-card shadow-sm transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/50",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{formatDisplayValue(value)}</p>
            {(previousValue !== undefined || percentage !== undefined) && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span>{calculatedPercentage.toFixed(1)}%</span>
                <span className="text-muted-foreground font-normal">vs prev period</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default KPICard
