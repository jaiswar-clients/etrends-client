"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartLegendContent } from "@/components/ui/chart"
import { DrillDownTable, getAggregatedDataColumns, getTransactionDetailColumns, exportToCSV } from "./DrillDownTable"
import { DrillDownResponse } from "@/redux/api/report"

interface ProductDrillDownProps {
  data: DrillDownResponse
  onBack?: () => void
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

const ProductDrillDown: React.FC<ProductDrillDownProps> = ({ data, onBack }) => {
  const aggregatedColumns = getAggregatedDataColumns()

  const chartData = data.aggregatedData.map((row) => ({
    period: row.period,
    order: row.orderRevenue,
    amc: row.amcRevenue,
    customization: row.customizationRevenue,
    license: row.licenseRevenue,
    service: row.serviceRevenue,
  }))

  const chartConfig = {
    order: { label: "Order", color: "hsl(var(--chart-1))" },
    amc: { label: "AMC", color: "hsl(var(--chart-2))" },
    customization: { label: "Customization", color: "hsl(var(--chart-3))" },
    license: { label: "License", color: "hsl(var(--chart-4))" },
    service: { label: "Service", color: "hsl(var(--chart-5))" },
  }

  const handleExportAggregated = () => {
    exportToCSV(data.aggregatedData, `product-drilldown-${data.metadata.drilldownValue || "all"}`)
  }

  const handleExportDetails = () => {
    if (data.details) {
      exportToCSV(data.details, `product-details-${data.metadata.drilldownValue || "all"}`)
    }
  }

  const totalRevenue = data.aggregatedData.reduce((sum, row) => sum + row.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
          {data.metadata.drilldownValue && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Product</p>
              <p className="text-lg font-semibold">{data.metadata.drilldownValue}</p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Revenue Breakdown Over Time</h3>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="period" tickLine={false} tick={{ fill: "hsl(var(--foreground))" }} />
                <YAxis tickLine={true} tick={{ fill: "hsl(var(--foreground))" }} tickFormatter={(value) => formatCurrency(value).replace('₹', '')} />
                <Legend content={<ChartLegendContent />} />
                <Tooltip />
                <Bar dataKey="order" stackId="a" fill={chartConfig.order.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="amc" stackId="a" fill={chartConfig.amc.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="customization" stackId="a" fill={chartConfig.customization.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="license" stackId="a" fill={chartConfig.license.color} radius={[4, 4, 0, 0]} />
                <Bar dataKey="service" stackId="a" fill={chartConfig.service.color} radius={[4, 4, 0, 0]} />
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
export const ProductDrillDownContent: React.FC<{ data: DrillDownResponse }> = ({ data }) => {
  return {
    summary: React.createElement(ProductDrillDown, { data }),
    details: data.details ? React.createElement("div", { className: "space-y-4" },
      React.createElement("h3", { className: "text-lg font-semibold" }, "Transaction Details"),
      React.createElement(DrillDownTable, {
        columns: getTransactionDetailColumns(),
        data: data.details,
        onExport: () => exportToCSV(data.details!, `product-details-${data.metadata.drilldownValue}`)
      })
    ) : null as React.ReactNode,
  }
}

export default ProductDrillDown
