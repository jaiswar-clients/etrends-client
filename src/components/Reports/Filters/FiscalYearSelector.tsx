"use client"

import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateFiscalYears, getCurrentFiscalYear } from '@/lib/fiscalYear'

interface FiscalYearSelectorProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

const FiscalYearSelector: React.FC<FiscalYearSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select Fiscal Year',
  className
}) => {
  const fiscalYears = generateFiscalYears(15)
  const currentFiscalYear = getCurrentFiscalYear()

  // Default to current fiscal year if no value is provided
  const displayValue = value || currentFiscalYear.startYear.toString()

  return (
    <Select
      value={displayValue}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={className || "w-[180px]"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {fiscalYears.map((fy) => (
          <SelectItem key={fy.value} value={fy.value}>
            {fy.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default FiscalYearSelector
