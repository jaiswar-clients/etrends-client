"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartLegendContent } from "@/components/ui/chart"
import { DrillDownTable, getAggregatedDataColumns, getTransactionDetailColumns, exportToCSV, formatCurrency } from "./DrillDownTable"
import { DrillDownResponse } from "@/redux/api/report"

interface TimeDrillDownProps {
  data: DrillDownResponse
  onBack?: () => void
}

// Module-level column definitions to avoid scope issues
const aggregatedColumns = getAggregatedDataColumns()
const detailColumns = getTransactionDetailColumns()

const TimeDrillDown: React.FC<TimeDrillDownProps> = ({ data, onBack }) => {

  const chartData = data.aggregatedData.map((row) => ({
    period: row.period,
    order: row.orderRevenue,
    amc: row.amcRevenue,
    customization: row.customizationRevenue,
    license: row.licenseRevenue,
    service: row.serviceRevenue,
    total: row.revenue,
  }))

  const chartConfig = {
    order: { label: "Order", color: "hsl(var(--chart-1))" },
    amc: { label: "AMC", color: "hsl(var(--chart-2))" },
    customization: { label: "Customization", color: "hsl(var(--chart-3))" },
    license: { label: "License", color: "hsl(var(--chart-4))" },
    service: { label: "Service", color: "hsl(var(--chart-5))" },
    total: { label: "Total", color: "hsl(var(--primary))" },
  }

  const handleExportAggregated = () => {
    exportToCSV(data.aggregatedData, `time-drilldown-${data.metadata.period}`)
  }

  const handleExportDetails = () => {
    if (data.details) {
      exportToCSV(data.details, `time-details-${data.metadata.period}`)
    }
  }

  const totalRevenue = data.aggregatedData.reduce((sum, row) => sum + row.revenue, 0)
  const avgRevenue = totalRevenue / data.aggregatedData.length

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Average Revenue</p>
          <p className="text-xl font-semibold">{formatCurrency(avgRevenue)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Highest Period</p>
          <p className="text-xl font-semibold">
            {data.aggregatedData.reduce((max, row) => row.revenue > max.revenue ? row : max).period}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Lowest Period</p>
          <p className="text-xl font-semibold">
            {data.aggregatedData.reduce((min, row) => row.revenue < min.revenue ? row : min).period}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Revenue Trend by Stream</h3>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="period" tickLine={false} tick={{ fill: "hsl(var(--foreground))" }} />
                <YAxis tickLine={true} tick={{ fill: "hsl(var(--foreground))" }} tickFormatter={(value) => formatCurrency(value).replace('₹', '')} />
                <Legend content={<ChartLegendContent />} />
                <Tooltip />
                <Bar dataKey="order" fill={chartConfig.order.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="amc" fill={chartConfig.amc.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="customization" fill={chartConfig.customization.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="license" fill={chartConfig.license.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="service" fill={chartConfig.service.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Aggregated Data</h3>
        <DrillDownTable
          columns={aggregatedColumns}
          data={data.aggregatedData}
          onExport={handleExportAggregated}
        />
      </div>
    </div>
  )
}

// Export as a component that returns both summary and details for modal
export const TimeDrillDownContent: React.FC<{ data: DrillDownResponse }> = ({ data }) => {
  return {
    summary: React.createElement(TimeDrillDown, { data }),
    details: data.details ? React.createElement("div", { className: "space-y-4" },
      React.createElement("h3", { className: "text-lg font-semibold" }, "Transaction Details"),
      React.createElement(DrillDownTable, {
        columns: detailColumns,
        data: data.details,
        onExport: () => exportToCSV(data.details!, `time-details-${data.metadata.period}`)
      })
    ) : null as React.ReactNode,
  }
}

export default TimeDrillDown
