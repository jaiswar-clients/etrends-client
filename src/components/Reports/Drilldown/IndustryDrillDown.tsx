"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartLegendContent } from "@/components/ui/chart"
import { DrillDownTable, exportToCSV, formatCurrency } from "./DrillDownTable"
import { DrillDownResponse } from "@/redux/api/report"

interface IndustryDrillDownProps {
  data: DrillDownResponse
  onBack?: () => void
}

const IndustryDrillDown: React.FC<IndustryDrillDownProps> = ({ data, onBack }) => {
  const chartData = data.aggregatedData.map((row) => ({
    period: row.period,
    revenue: row.revenue,
  }))

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
  }

  const handleExportAggregated = () => {
    exportToCSV(data.aggregatedData, `industry-drilldown-${data.metadata.drilldownValue || "all"}`)
  }

  const handleExportDetails = () => {
    if (data.details) {
      exportToCSV(data.details, `industry-details-${data.metadata.drilldownValue || "all"}`)
    }
  }

  const totalRevenue = data.aggregatedData.reduce((sum, row) => sum + row.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
          {data.metadata.drilldownValue && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Industry</p>
              <p className="text-lg font-semibold">{data.metadata.drilldownValue}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Revenue Trend</h3>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="period" tickLine={false} tick={{ fill: "hsl(var(--foreground))" }} />
                <YAxis tickLine={true} tick={{ fill: "hsl(var(--foreground))" }} tickFormatter={(value) => formatCurrency(value).replace('₹', '')} />
                <Legend content={<ChartLegendContent />} />
                <Tooltip />
                <Bar dataKey="revenue" fill={chartConfig.revenue.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Revenue by Period</h3>
        <DrillDownTable
          columns={[
            { accessorKey: "period", header: "Period", cell: ({ row }) => <div className="font-medium">{row.period}</div> },
            { accessorKey: "revenue", header: "Revenue", cell: ({ row }) => {
              const amount = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(row.revenue)
              return <div className="font-medium">{amount}</div>
            }},
            { accessorKey: "percentage", header: "Share of Total", cell: ({ row }) => {
              const percentage = row.percentage || 0
              return <div className="text-muted-foreground">{percentage.toFixed(1)}%</div>
            }},
          ]}
          data={data.aggregatedData}
          onExport={handleExportAggregated}
        />
      </div>
    </div>
  )
}

// Export as a component that returns both summary and details for modal
export const IndustryDrillDownContent: React.FC<{ data: DrillDownResponse }> = ({ data }) => {
  return {
    summary: React.createElement(IndustryDrillDown, { data }),
    details: data.details ? React.createElement("div", { className: "space-y-4" },
      React.createElement("h3", { className: "text-lg font-semibold" }, "Transaction Details"),
      React.createElement(DrillDownTable, {
        columns: [
          { accessorKey: "date", header: "Date", cell: ({ row }) => <div>{new Date(row.date).toLocaleDateString()}</div> },
          { accessorKey: "type", header: "Type", cell: ({ row }) => <div className="capitalize">{row.type}</div> },
          { accessorKey: "client", header: "Client", cell: ({ row }) => <div className="font-medium">{row.client}</div> },
          { accessorKey: "amount", header: "Amount", cell: ({ row }) => <div className="font-medium">{formatCurrency(row.amount)}</div> },
          { accessorKey: "status", header: "Status", cell: ({ row }) => {
            const statusColors = { paid: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800", proforma: "bg-blue-100 text-blue-800", invoice: "bg-purple-100 text-purple-800" }
            const colorClass = statusColors[row.status] || "bg-gray-100 text-gray-800"
            return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>{row.status}</span>
          }},
        ],
        data: data.details,
        onExport: () => exportToCSV(data.details!, `industry-details-${data.metadata.drilldownValue}`)
      })
    ) : null as React.ReactNode,
  }
}

export default IndustryDrillDown
