"use client";

import React, { useState } from 'react';
import KPIGrid, { KPI_TO_DRILL_DOWN_TYPE } from '@/components/Reports/KPIGrid';
import RevenueTrendChart from '@/components/Reports/Chart/RevenueTrendChart';
import ProductDistributionChart from '@/components/Reports/Chart/ProductDistributionChart';
import ReportsFilters, { ReportsFiltersState } from '@/components/Reports/ReportsFilters';
import ActiveFilters from '@/components/Reports/Filters/ActiveFilters';
import DrillDownRouter from '@/components/Reports/Drilldown/DrillDownRouter';
import { useGetDashboardQuery, useGetDrillDownQuery, DashboardFiltersQuery, DrillDownFiltersQuery } from '@/redux/api/report';
import { getCurrentFiscalQuarter } from '@/lib/fiscalYear';

export type DrillDownType = 'product' | 'client' | 'industry' | 'time' | 'amc'

export default function ReportsPage() {
  const currentQuarter = getCurrentFiscalQuarter();

  const [filters, setFilters] = useState<ReportsFiltersState>({
    filter: 'monthly',
    fiscalYear: currentQuarter.year,
  });

  const [drillDown, setDrillDown] = useState<{
    type: DrillDownType | null
    value?: string
  }>({ type: null })

  // Build the query params for dashboard
  const dashboardQueryParams: DashboardFiltersQuery = {
    filter: filters.filter,
    fiscalYear: filters.fiscalYear,
    quarter: filters.quarter,
    startDate: filters.startDate,
    endDate: filters.endDate,
    clientIds: filters.clientIds,
    productIds: filters.productIds,
    industries: filters.industries,
    revenueStreams: filters.revenueStreams,
    paymentStatuses: filters.paymentStatuses,
  }

  const { data: dashboardData, isLoading } = useGetDashboardQuery(dashboardQueryParams)

  // Build drill-down query params
  const drillDownQueryParams: DrillDownFiltersQuery | undefined = drillDown.type ? {
    ...dashboardQueryParams,
    drilldownType: drillDown.type,
    drilldownValue: drillDown.value,
    includeDetails: true,
  } : undefined

  const { data: drillDownData, isLoading: isDrillDownLoading } = useGetDrillDownQuery(drillDownQueryParams!, {
    skip: !drillDownQueryParams,
  })

  const handleFilterChange = (newFilters: ReportsFiltersState) => {
    setFilters(newFilters)
  }

  const handleDrillDown = (kpiType: string, value?: string) => {
    const drillDownType = KPI_TO_DRILL_DOWN_TYPE[kpiType] || 'time'
    setDrillDown({
      type: drillDownType,
      value,
    })
  }

  const handleCloseDrillDown = () => {
    setDrillDown({ type: null })
  }

  const handleClearFilter = (key: keyof ReportsFiltersState) => {
    setFilters((prev) => ({
      ...prev,
      [key]: Array.isArray(prev[key]) ? [] : undefined,
    }))
  }

  const handleClearAllFilters = () => {
    setFilters({
      filter: 'monthly',
      fiscalYear: currentQuarter.year,
    })
  }

  // Build active filters display
  const activeFilters = React.useMemo(() => {
    const filtersArray: Parameters<typeof ActiveFilters>[0]['filters'] = []

    if (filters.filter === 'custom') {
      if (filters.startDate || filters.endDate) {
        filtersArray.push({
          key: 'dateRange',
          label: 'Date Range',
          value: filters.startDate && filters.endDate
            ? `${new Date(filters.startDate).toLocaleDateString()} - ${new Date(filters.endDate).toLocaleDateString()}`
            : 'Custom',
          onRemove: () => handleClearFilter('filter'),
        })
      }
    }

    if (filters.clientIds && filters.clientIds.length > 0) {
      filtersArray.push({
        key: 'clientIds',
        label: 'Clients',
        value: filters.clientIds,
        onRemove: () => handleClearFilter('clientIds'),
      })
    }

    if (filters.productIds && filters.productIds.length > 0) {
      filtersArray.push({
        key: 'productIds',
        label: 'Products',
        value: filters.productIds,
        onRemove: () => handleClearFilter('productIds'),
      })
    }

    if (filters.industries && filters.industries.length > 0) {
      filtersArray.push({
        key: 'industries',
        label: 'Industries',
        value: filters.industries,
        onRemove: () => handleClearFilter('industries'),
      })
    }

    if (filters.revenueStreams && filters.revenueStreams.length > 0) {
      filtersArray.push({
        key: 'revenueStreams',
        label: 'Revenue Streams',
        value: filters.revenueStreams,
        onRemove: () => handleClearFilter('revenueStreams'),
      })
    }

    if (filters.paymentStatuses && filters.paymentStatuses.length > 0) {
      filtersArray.push({
        key: 'paymentStatuses',
        label: 'Payment Status',
        value: filters.paymentStatuses,
        onRemove: () => handleClearFilter('paymentStatuses'),
      })
    }

    return filtersArray
  }, [filters])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive view of your business performance
          </p>
        </div>
        <ReportsFilters
          value={filters}
          onChange={handleFilterChange}
        />
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <ActiveFilters
            filters={activeFilters}
            onClearAll={handleClearAllFilters}
          />
        </div>
      )}

      {dashboardData?.data?.summary && (
        <KPIGrid
          summary={dashboardData.data.summary}
          isLoading={isLoading}
          onKPIClick={handleDrillDown}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {dashboardData?.data?.trends && (
          <RevenueTrendChart
            data={dashboardData.data.trends.totalBilling}
            isLoading={isLoading}
            onClick={() => handleDrillDown('totalRevenue')}
          />
        )}
        {dashboardData?.data?.distributions && (
          <ProductDistributionChart
            data={dashboardData.data.distributions.productWise}
            isLoading={isLoading}
            onClick={() => handleDrillDown('product')}
          />
        )}
      </div>

      {/* Drill-Down Modal */}
      <DrillDownRouter
        open={drillDown.type !== null}
        onClose={handleCloseDrillDown}
        data={drillDownData?.data}
        isLoading={isDrillDownLoading}
      />
    </div>
  );
}
