"use client";

import React, { useState } from 'react';
import KPIGrid, { KPI_TO_DRILL_DOWN_TYPE, type KPIDrillDownConfig } from '@/components/Reports/KPIGrid';
import RevenueTrendChart from '@/components/Reports/Chart/RevenueTrendChart';
import ProductDistributionChart from '@/components/Reports/Chart/ProductDistributionChart';
import ReportsFilters, { ReportsFiltersState } from '@/components/Reports/ReportsFilters';
import ActiveFilters from '@/components/Reports/Filters/ActiveFilters';
import DrillDownRouter from '@/components/Reports/Drilldown/DrillDownRouter';
import { useGetDashboardQuery, useGetDrillDownQuery, DashboardFiltersQuery, DrillDownFiltersQuery } from '@/redux/api/report';
import { getCurrentFiscalQuarter } from '@/lib/fiscalYear';
import { Button } from '@/components/ui/button';
import { Download, Mail, BarChart3 } from 'lucide-react';
 
export type DrillDownType = 'product' | 'client' | 'time';
 
export default function ReportsPage() {
  const currentQuarter = getCurrentFiscalQuarter();

  const [filters, setFilters] = useState<ReportsFiltersState>({
    filter: 'monthly',
    fiscalYear: currentQuarter.year,
  });

  const [drillDown, setDrillDown] = useState<{
    type: DrillDownType | null
    value?: string
    paymentStatuses?: string[]
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
    // Override payment statuses if drill-down has specific ones (e.g., for Pending Payments KPI)
    paymentStatuses: drillDown.paymentStatuses || dashboardQueryParams.paymentStatuses,
  } : undefined

  const { data: drillDownData, isLoading: isDrillDownLoading } = useGetDrillDownQuery(drillDownQueryParams!, {
    skip: !drillDownQueryParams,
  })

  const handleFilterChange = (newFilters: ReportsFiltersState) => {
    setFilters(newFilters)
  }

  const handleDrillDown = (kpiType: string, config: KPIDrillDownConfig) => {
    setDrillDown({
      type: config.type,
      paymentStatuses: config.paymentStatuses,
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
            Key business metrics at a glance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => alert('Export functionality coming soon')}>
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => alert('Schedule email functionality coming soon')}>
            <Mail className="h-3 w-3 mr-1" /> Schedule
          </Button>
          <ReportsFilters
            value={filters}
            onChange={handleFilterChange}
          />
        </div>
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
            onClick={() => handleDrillDown('totalRevenue', KPI_TO_DRILL_DOWN_TYPE['totalRevenue'])}
          />
        )}
        {dashboardData?.data?.distributions && (
          <ProductDistributionChart
            data={dashboardData.data.distributions.productWise}
            isLoading={isLoading}
            onClick={() => handleDrillDown('product', { type: 'product', description: 'Product Revenue Breakdown' })}
          />
        )}
      </div>

      {/* Call to Action Section */}
      <div className="mt-8 pt-6 border-t">
        <h2 className="text-xl font-semibold mb-4">Take Action</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="default" className="w-full py-3" onClick={() => alert('Export functionality coming soon')}>
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
          <Button variant="outline" className="w-full py-3" onClick={() => alert('Schedule email functionality coming soon')}>
            <Mail className="h-4 w-4 mr-2" /> Schedule Email
          </Button>
          <Button variant="default" className="w-full py-3" onClick={() => alert('Detailed reports functionality coming soon')}>
            <BarChart3 className="h-4 w-4 mr-2" /> View Detailed Reports
          </Button>
        </div>
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
