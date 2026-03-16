"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartLegendContent } from "@/components/ui/chart"
import { DrillDownTable, exportToCSV, formatCurrency } from "./DrillDownTable"
import { DrillDownResponse, TransactionDetail } from "@/redux/api/report"
import { Row } from "@tanstack/react-table"

interface AMCDrillDownProps {
  data: DrillDownResponse
  onBack?: () => void
}

interface AMCDataRow {
  period: string
  expected: number
  collected: number
}

const AMCDrillDown: React.FC<AMCDrillDownProps> = ({ data, onBack }) => {
  const chartData = data.aggregatedData.map((row): AMCDataRow => {
    const expected = row.orderRevenue + row.amcRevenue
    const collected = row.amcRevenue
    return {
      period: row.period,
      expected,
      collected,
    }
  })

  const chartConfig = {
    expected: { label: "Expected", color: "hsl(var(--chart-1))" },
    collected: { label: "Collected", color: "hsl(var(--chart-2))" },
  }

  const handleExportAggregated = () => {
    exportToCSV(chartData, `amc-drilldown-${data.metadata.period}`)
  }

  const handleExportDetails = () => {
    if (data.details) {
      exportToCSV(data.details, `amc-details-${data.metadata.period}`)
    }
  }

  const totalExpected = chartData.reduce((sum, row) => sum + row.expected, 0)
  const totalCollected = chartData.reduce((sum, row) => sum + row.collected, 0)
  const totalPending = totalExpected - totalCollected
  const overallRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Expected</p>
          <p className="text-2xl font-bold">{formatCurrency(totalExpected)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Collection Rate</p>
          <p className={`text-2xl font-bold ${overallRate >= 80 ? 'text-green-600' : overallRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {overallRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Expected vs Collected</h3>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="period" tickLine={false} tick={{ fill: "hsl(var(--foreground))" }} />
                <YAxis tickLine={true} tick={{ fill: "hsl(var(--foreground))" }} tickFormatter={(value) => formatCurrency(value).replace('₹', '')} />
                <Legend content={<ChartLegendContent />} />
                <Tooltip />
                <Bar dataKey="expected" fill={chartConfig.expected.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" fill={chartConfig.collected.color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Collection Details by Period</h3>
        <DrillDownTable
          columns={[
            { accessorKey: "period", header: "Period", cell: ({ row }: { row: Row<AMCDataRow> }) => <div className="font-medium">{row.getValue("period")}</div> },
            { accessorKey: "expected", header: "Expected", cell: ({ row }: { row: Row<AMCDataRow> }) => <div className="font-medium">{formatCurrency(row.getValue("expected"))}</div> },
            { accessorKey: "collected", header: "Collected", cell: ({ row }: { row: Row<AMCDataRow> }) => <div className="text-green-600 font-medium">{formatCurrency(row.getValue("collected"))}</div> },
            { accessorKey: "pending", header: "Pending", cell: ({ row }: { row: Row<AMCDataRow> }) => {
              const expected = row.getValue("expected") as number
              const collected = row.getValue("collected") as number
              const pending = expected - collected
              return <div className="text-yellow-600">{formatCurrency(pending)}</div>
            }},
            { accessorKey: "collectionRate", header: "Collection Rate", cell: ({ row }: { row: Row<AMCDataRow> }) => {
              const expected = row.getValue("expected") as number
              const collected = row.getValue("collected") as number
              const rate = expected > 0 ? (collected / expected) * 100 : 0
              const colorClass = rate >= 80 ? "text-green-600" : rate >= 60 ? "text-yellow-600" : "text-red-600"
              return <div className={`font-medium ${colorClass}`}>{rate.toFixed(1)}%</div>
            }},
          ]}
          data={chartData}
          onExport={handleExportAggregated}
        />
      </div>
    </div>
  )
}

// Export as a component that returns both summary and details for modal
export const AMCDrillDownContent: React.FC<{ data: DrillDownResponse }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <AMCDrillDown data={data} />
      {data.details && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Transaction Details</h3>
          <DrillDownTable
            columns={[
              { accessorKey: "date", header: "Date", cell: ({ row }: { row: Row<TransactionDetail> }) => <div>{new Date(row.getValue("date")).toLocaleDateString()}</div> },
              { accessorKey: "type", header: "Type", cell: ({ row }: { row: Row<TransactionDetail> }) => <div className="capitalize">{row.getValue("type")}</div> },
              { accessorKey: "client", header: "Client", cell: ({ row }: { row: Row<TransactionDetail> }) => <div className="font-medium">{row.getValue("client")}</div> },
              { accessorKey: "amount", header: "Amount", cell: ({ row }: { row: Row<TransactionDetail> }) => <div className="font-medium">{formatCurrency(row.getValue("amount"))}</div> },
              { accessorKey: "status", header: "Status", cell: ({ row }: { row: Row<TransactionDetail> }) => {
                const statusColors: Record<string, string> = { paid: "bg-green-100 text-green-800", pending: "bg-yellow-100 text-yellow-800", proforma: "bg-blue-100 text-blue-800", invoice: "bg-purple-100 text-purple-800" }
                const status = row.getValue("status") as string
                const colorClass = statusColors[status] || "bg-gray-100 text-gray-800"
                return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>{status}</span>
              }},
            ]}
            data={data.details}
            onExport={() => exportToCSV(data.details!, `amc-details-${data.metadata.period}`)}
          />
        </div>
      )}
    </div>
  )
}

export default AMCDrillDown
