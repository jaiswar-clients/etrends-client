"use client"

import React from 'react'
import KPICard from './KPICard'
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Users,
  ShoppingBag,
  Clock
} from 'lucide-react'
import type { DashboardSummary } from '@/redux/api/report'

interface KPIGridProps {
  summary?: DashboardSummary
  isLoading?: boolean
  onKPIClick?: (kpiType: string, config: KPIDrillDownConfig) => void
}

// Map KPI types to drill-down types and additional context
export interface KPIDrillDownConfig {
  type: 'product' | 'client' | 'time'
  paymentStatuses?: string[]
  description?: string
}

const KPI_TO_DRILL_DOWN_TYPE: Record<string, KPIDrillDownConfig> = {
  totalRevenue: { type: 'time', description: 'Total Revenue Trend' },
  pendingPayments: { type: 'time', paymentStatuses: ['pending'], description: 'Pending Payments Trend' },
  totalClients: { type: 'client', description: 'Client List' },
  revenueByProduct: { type: 'product', description: 'Top Products by Revenue' },
}

const KPIGrid: React.FC<KPIGridProps> = ({
  summary,
  isLoading = false,
  onKPIClick
}) => {
  const handleKPIClick = (kpiType: string) => {
    const config = KPI_TO_DRILL_DOWN_TYPE[kpiType]
    if (config && onKPIClick) {
      onKPIClick(kpiType, config)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <KPICard
        title="Total Revenue"
        value={summary?.totalRevenue ?? 0}
        trend={summary?.revenueGrowth ? (summary.revenueGrowth >= 0 ? 'up' : 'down') : 'neutral'}
        percentage={Math.abs(summary?.revenueGrowth ?? 0)}
        icon={IndianRupee}
        isLoading={isLoading}
        onClick={() => handleKPIClick('totalRevenue')}
      />
      <KPICard
        title="Pending Payments"
        value={summary?.pendingPayments ?? 0}
        icon={Clock}
        isLoading={isLoading}
        onClick={() => handleKPIClick('pendingPayments')}
      />
      <KPICard
        title="Total Clients"
        value={summary?.totalClients ?? 0}
        formatValue="number"
        icon={Users}
        isLoading={isLoading}
        onClick={() => handleKPIClick('totalClients')}
      />
      <KPICard
        title="Revenue by Product"
        value={summary?.totalRevenue ?? 0} // Using total revenue as placeholder, will be replaced with actual product revenue in chart
        icon={ShoppingBag}
        isLoading={isLoading}
        onClick={() => handleKPIClick('revenueByProduct')}
      />
    </div>
  )
}

export default KPIGrid
export { KPI_TO_DRILL_DOWN_TYPE }
