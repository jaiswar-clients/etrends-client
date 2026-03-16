"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface FilterDisplay {
  key: string
  label: string
  value: string | string[]
  onRemove: () => void
}

interface ActiveFiltersProps {
  filters: FilterDisplay[]
  onClearAll?: () => void
  className?: string
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onClearAll,
  className,
}) => {
  if (filters.length === 0) return null

  const displayValue = (value: string | string[]): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return ""
      if (value.length === 1) return value[0]
      if (value.length <= 2) return value.join(", ")
      return `${value[0]}, ${value[1]} +${value.length - 2} more`
    }
    return value
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {filters.map((filter) => (
        <Badge key={filter.key} variant="secondary" className="gap-1 pr-1">
          <span className="font-medium">{filter.label}:</span>
          <span>{displayValue(filter.value)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
            onClick={filter.onRemove}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filter.label}</span>
          </Button>
        </Badge>
      ))}
      {onClearAll && filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  )
}

export default ActiveFilters
