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
  onKPIClick?: (kpiType: string) => void
}

// Map KPI types to drill-down types
const KPI_TO_DRILL_DOWN_TYPE: Record<string, 'product' | 'client' | 'industry' | 'time' | 'amc'> = {
  totalRevenue: 'time',
  amcRevenue: 'amc',
  newBusinessRevenue: 'time',
  pendingPayments: 'time',
  totalClients: 'client',
  revenueGrowth: 'time',
}

const KPIGrid: React.FC<KPIGridProps> = ({
  summary,
  isLoading = false,
  onKPIClick
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KPICard
        title="Total Revenue"
        value={summary?.totalRevenue ?? 0}
        trend={summary?.revenueGrowth ? (summary.revenueGrowth >= 0 ? 'up' : 'down') : 'neutral'}
        percentage={Math.abs(summary?.revenueGrowth ?? 0)}
        icon={IndianRupee}
        isLoading={isLoading}
        onClick={() => onKPIClick?.('totalRevenue')}
      />
      <KPICard
        title="AMC Revenue"
        value={summary?.amcRevenue ?? 0}
        icon={Calendar}
        isLoading={isLoading}
        onClick={() => onKPIClick?.('amcRevenue')}
      />
      <KPICard
        title="New Business"
        value={summary?.newBusinessRevenue ?? 0}
        icon={ShoppingBag}
        isLoading={isLoading}
        onClick={() => onKPIClick?.('newBusinessRevenue')}
      />
      <KPICard
        title="Pending Payments"
        value={summary?.pendingPayments ?? 0}
        icon={Clock}
        isLoading={isLoading}
        onClick={() => onKPIClick?.('pendingPayments')}
      />
      <KPICard
        title="Total Clients"
        value={summary?.totalClients ?? 0}
        formatValue="number"
        icon={Users}
        isLoading={isLoading}
        onClick={() => onKPIClick?.('totalClients')}
      />
      <KPICard
        title="Revenue Growth"
        value={summary?.revenueGrowth ?? 0}
        formatValue="percentage"
        trend={summary?.revenueGrowth ? (summary.revenueGrowth >= 0 ? 'up' : 'down') : 'neutral'}
        icon={TrendingUp}
        isLoading={isLoading}
        onClick={() => onKPIClick?.('revenueGrowth')}
      />
    </div>
  )
}

export default KPIGrid
export { KPI_TO_DRILL_DOWN_TYPE }
