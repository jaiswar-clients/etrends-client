"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FiscalYearSelector from './Filters/FiscalYearSelector'
import QuarterSelector from './Filters/QuarterSelector'
import MultiSelectFilter from './Filters/MultiSelectFilter'
import { DatePickerWithRange } from '@/components/ui/daterangepicker'
import { Filter, X, RotateCcw } from 'lucide-react'
import { getCurrentFiscalYear, getCurrentFiscalQuarter } from '@/lib/fiscalYear'
import { useGetFilterOptionsQuery } from '@/redux/api/report'

export type FilterType = 'monthly' | 'quarterly' | 'yearly' | 'all' | 'custom'

export interface ReportsFiltersState {
  filter: FilterType
  fiscalYear?: number
  quarter?: string
  startDate?: string
  endDate?: string
  clientIds?: string[]
  productIds?: string[]
  industries?: string[]
  revenueStreams?: string[]
  paymentStatuses?: string[]
}

interface ReportsFiltersProps {
  value: ReportsFiltersState
  onChange: (filters: ReportsFiltersState) => void
  className?: string
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Range' },
]

// Revenue stream options
const revenueStreamOptions = [
  { value: 'order', label: 'Order' },
  { value: 'amc', label: 'AMC' },
  { value: 'customization', label: 'Customization' },
  { value: 'license', label: 'License' },
  { value: 'service', label: 'Service' },
]

// Payment status options
const paymentStatusOptions = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'proforma', label: 'Proforma' },
  { value: 'invoice', label: 'Invoice' },
]

const ReportsFilters: React.FC<ReportsFiltersProps> = ({
  value,
  onChange,
  className
}) => {
  const [localFilters, setLocalFilters] = useState<ReportsFiltersState>(value)
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>(
    value.startDate && value.endDate
      ? { from: new Date(value.startDate), to: new Date(value.endDate) }
      : { from: undefined, to: undefined }
  )

  const { data: filterOptionsData, isLoading: isLoadingOptions } = useGetFilterOptionsQuery()

  const currentFiscalYear = getCurrentFiscalYear()
  const currentQuarter = getCurrentFiscalQuarter()

  // Sync local state with external value
  useEffect(() => {
    setLocalFilters(value)
    if (value.startDate && value.endDate) {
      setDateRange({ from: new Date(value.startDate), to: new Date(value.endDate) })
    }
  }, [value])

  // Check if filters are different from defaults
  const hasActiveFilters = useCallback(() => {
    return (
      value.filter !== 'monthly' ||
      value.fiscalYear !== currentFiscalYear.startYear ||
      value.clientIds?.length > 0 ||
      value.productIds?.length > 0 ||
      value.industries?.length > 0 ||
      value.revenueStreams?.length > 0 ||
      value.paymentStatuses?.length > 0 ||
      (value.filter === 'custom' && (value.startDate || value.endDate))
    )
  }, [value, currentFiscalYear.startYear])

  const handleFilterTypeChange = (filterType: FilterType) => {
    const newFilters: ReportsFiltersState = {
      ...localFilters,
      filter: filterType,
    }

    // Set default fiscal year for yearly/quarterly filters
    if (filterType === 'yearly' || filterType === 'quarterly') {
      newFilters.fiscalYear = localFilters.fiscalYear || currentFiscalYear.startYear
    }

    // Set default quarter for quarterly filter
    if (filterType === 'quarterly') {
      newFilters.quarter = localFilters.quarter || currentQuarter.quarter
    }

    // Clear quarter if not quarterly
    if (filterType !== 'quarterly') {
      delete newFilters.quarter
    }

    // Clear date range for non-custom filters
    if (filterType !== 'custom') {
      delete newFilters.startDate
      delete newFilters.endDate
      setDateRange({ from: undefined, to: undefined })
    }

    setLocalFilters(newFilters)
  }

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    setDateRange(range)
    setLocalFilters({
      ...localFilters,
      startDate: range?.from?.toISOString(),
      endDate: range?.to?.toISOString(),
    })
  }

  const handleFiscalYearChange = (fiscalYear: string) => {
    setLocalFilters({
      ...localFilters,
      fiscalYear: parseInt(fiscalYear, 10),
      // Reset quarter when fiscal year changes
      quarter: localFilters.filter === 'quarterly'
        ? `Q1 ${fiscalYear}`
        : undefined
    })
  }

  const handleQuarterChange = (quarter: string) => {
    setLocalFilters({
      ...localFilters,
      quarter
    })
  }

  const handleApply = () => {
    onChange(localFilters)
    setIsOpen(false)
  }

  const handleReset = () => {
    const defaultFilters: ReportsFiltersState = {
      filter: 'monthly',
      fiscalYear: currentFiscalYear.startYear
    }
    setLocalFilters(defaultFilters)
    onChange(defaultFilters)
    setIsOpen(false)
  }

  const handleClearFilters = () => {
    handleReset()
  }

  // Show/hide fiscal year and quarter selectors based on filter type
  const showFiscalYear = localFilters.filter === 'yearly' || localFilters.filter === 'quarterly'
  const showQuarter = localFilters.filter === 'quarterly'
  const showDateRange = localFilters.filter === 'custom'

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters() && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Report Filters</SheetTitle>
            <SheetDescription>
              Configure the time period and filters for the reports dashboard.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Filter Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Type</label>
              <Select
                value={localFilters.filter}
                onValueChange={(val) => handleFilterTypeChange(val as FilterType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select filter type" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fiscal Year - shown for yearly and quarterly */}
            {showFiscalYear && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Fiscal Year</label>
                <FiscalYearSelector
                  value={localFilters.fiscalYear?.toString()}
                  onChange={handleFiscalYearChange}
                  className="w-full"
                />
              </div>
            )}

            {/* Quarter - shown only for quarterly */}
            {showQuarter && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quarter</label>
                <QuarterSelector
                  fiscalYear={localFilters.fiscalYear}
                  value={localFilters.quarter}
                  onChange={handleQuarterChange}
                  className="w-full"
                />
              </div>
            )}

            {/* Custom Date Range - shown only for custom filter */}
            {showDateRange && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Date Range</label>
                <DatePickerWithRange
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  className="w-full"
                />
              </div>
            )}

            {/* Multi-select filters */}
            <div className="space-y-4 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground">Additional Filters</p>

              <MultiSelectFilter
                label="Clients"
                options={filterOptionsData?.data?.clients || []}
                selected={localFilters.clientIds || []}
                onChange={(selected) => setLocalFilters({ ...localFilters, clientIds: selected })}
                isLoading={isLoadingOptions}
              />

              <MultiSelectFilter
                label="Products"
                options={filterOptionsData?.data?.products || []}
                selected={localFilters.productIds || []}
                onChange={(selected) => setLocalFilters({ ...localFilters, productIds: selected })}
                isLoading={isLoadingOptions}
              />

              <MultiSelectFilter
                label="Industries"
                options={filterOptionsData?.data?.industries || []}
                selected={localFilters.industries || []}
                onChange={(selected) => setLocalFilters({ ...localFilters, industries: selected })}
                isLoading={isLoadingOptions}
              />

              <MultiSelectFilter
                label="Revenue Streams"
                options={revenueStreamOptions}
                selected={localFilters.revenueStreams || []}
                onChange={(selected) => setLocalFilters({ ...localFilters, revenueStreams: selected })}
              />

              <MultiSelectFilter
                label="Payment Status"
                options={paymentStatusOptions}
                selected={localFilters.paymentStatuses || []}
                onChange={(selected) => setLocalFilters({ ...localFilters, paymentStatuses: selected })}
              />
            </div>
          </div>

          <SheetFooter className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t">
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1 gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <SheetClose asChild>
                <Button
                  onClick={handleApply}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Clear filters button when active */}
      {hasActiveFilters() && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          <span className="text-xs">Clear</span>
        </Button>
      )}
    </div>
  )
}

export default ReportsFilters
