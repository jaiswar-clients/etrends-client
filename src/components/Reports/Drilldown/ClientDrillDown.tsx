"use client"

import * as React from "react"
import { DrillDownTable, exportToCSV, formatCurrency } from "./DrillDownTable"
import { DrillDownResponse } from "@/redux/api/report"

interface ClientDrillDownProps {
  data: DrillDownResponse
  onBack?: () => void
}

const ClientDrillDown: React.FC<ClientDrillDownProps> = ({ data, onBack }) => {
  const handleExportAggregated = () => {
    exportToCSV(data.aggregatedData, `client-drilldown-${data.metadata.drilldownValue || "all"}`)
  }

  const handleExportDetails = () => {
    if (data.details) {
      exportToCSV(data.details, `client-details-${data.metadata.drilldownValue || "all"}`)
    }
  }

  const totalRevenue = data.aggregatedData.reduce((sum, row) => sum + row.revenue, 0)

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Order Revenue</p>
          <p className="text-xl font-semibold">{formatCurrency(data.aggregatedData.reduce((sum, row) => sum + row.orderRevenue, 0))}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">AMC Revenue</p>
          <p className="text-xl font-semibold">{formatCurrency(data.aggregatedData.reduce((sum, row) => sum + row.amcRevenue, 0))}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Periods</p>
          <p className="text-xl font-semibold">{data.aggregatedData.length}</p>
        </div>
      </div>

      {/* Summary Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Revenue by Period</h3>
        <DrillDownTable
          columns={[
            { accessorKey: "period", header: "Period", cell: ({ row }) => <div className="font-medium">{row.period}</div> },
            { accessorKey: "revenue", header: "Total Revenue", cell: ({ row }) => <div className="font-medium">{formatCurrency(row.revenue)}</div> },
            { accessorKey: "orderRevenue", header: "Order Revenue", cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(row.orderRevenue)}</div> },
            { accessorKey: "amcRevenue", header: "AMC Revenue", cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(row.amcRevenue)}</div> },
            { accessorKey: "customizationRevenue", header: "Customization", cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(row.customizationRevenue)}</div> },
            { accessorKey: "licenseRevenue", header: "License", cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(row.licenseRevenue)}</div> },
            { accessorKey: "serviceRevenue", header: "Service", cell: ({ row }) => <div className="text-muted-foreground">{formatCurrency(row.serviceRevenue)}</div> },
          ]}
          data={data.aggregatedData}
          onExport={handleExportAggregated}
        />
      </div>
    </div>
  )
}

// Export as a component that returns both summary and details for modal
export const ClientDrillDownContent: React.FC<{ data: DrillDownResponse }> = ({ data }) => {
  return {
    summary: React.createElement(ClientDrillDown, { data }),
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
        onExport: () => exportToCSV(data.details!, `client-details-${data.metadata.drilldownValue}`)
      })
    ) : null as React.ReactNode,
  }
}

export default ClientDrillDown
