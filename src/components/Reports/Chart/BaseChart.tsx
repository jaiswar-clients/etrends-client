"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface BaseChartProps {
  title?: string
  description?: string
  children: React.ReactNode
  isLoading?: boolean
  className?: string
  onClick?: () => void
  headerAction?: React.ReactNode
}

const BaseChart: React.FC<BaseChartProps> = ({
  title,
  description,
  children,
  isLoading = false,
  className,
  onClick,
  headerAction
}) => {
  return (
    <Card
      className={cn(
        "rounded-xl border bg-card shadow-sm",
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200",
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
              {description && (
                <CardDescription className="mt-1 text-sm text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("pt-0", !title && !description && "pt-6")}>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

export default BaseChart
