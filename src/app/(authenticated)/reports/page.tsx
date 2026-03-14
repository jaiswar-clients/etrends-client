"use client";

import React, { useState } from 'react';
import KPIGrid from '@/components/Reports/KPIGrid';
import RevenueTrendChart from '@/components/Reports/Chart/RevenueTrendChart';
import ProductDistributionChart from '@/components/Reports/Chart/ProductDistributionChart';
import ReportsFilters, { ReportsFiltersState } from '@/components/Reports/ReportsFilters';
import { useGetDashboardQuery } from '@/redux/api/report';
import { getCurrentFiscalQuarter } from '@/lib/fiscalYear';

export default function ReportsPage() {
  const currentQuarter = getCurrentFiscalQuarter();

  const [filters, setFilters] = useState<ReportsFiltersState>({
    filter: 'monthly',
    fiscalYear: currentQuarter.year,
  });

  const { data: dashboardData, isLoading } = useGetDashboardQuery({
    filter: filters.filter,
    fiscalYear: filters.fiscalYear,
  });

  const handleFilterChange = (newFilters: ReportsFiltersState) => {
    setFilters(newFilters);
  };

  const handleDrillDown = (type: string) => {
    console.log('Drill down to:', type);
  };

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
            onClick={() => handleDrillDown('revenue_trend')}
          />
        )}
        {dashboardData?.data?.distributions && (
          <ProductDistributionChart
            data={dashboardData.data.distributions.productWise}
            isLoading={isLoading}
            onClick={() => handleDrillDown('product_distribution')}
          />
        )}
      </div>
    </div>
  );
}
