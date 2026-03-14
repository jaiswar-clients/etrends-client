"use client"

import React, { useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getFiscalYearQuarters, getCurrentFiscalQuarter } from '@/lib/fiscalYear'

interface QuarterSelectorProps {
  fiscalYear?: number
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const QuarterSelector: React.FC<QuarterSelectorProps> = ({
  fiscalYear,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select Quarter',
  className
}) => {
  // Get the current fiscal quarter to determine default fiscal year
  const currentQuarter = getCurrentFiscalQuarter()
  
  // Use provided fiscal year or default to current
  const selectedFiscalYear = fiscalYear || currentQuarter.year

  const quarters = useMemo(() => {
    return getFiscalYearQuarters(selectedFiscalYear)
  }, [selectedFiscalYear])

  // Default to current quarter if in the selected fiscal year
  const defaultValue = selectedFiscalYear === currentQuarter.year
    ? currentQuarter.quarter
    : quarters[0]?.value

  const displayValue = value || defaultValue

  return (
    <Select
      value={displayValue}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={className || "w-[200px]"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {quarters.map((quarter) => (
          <SelectItem key={quarter.value} value={quarter.value}>
            {quarter.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default QuarterSelector
