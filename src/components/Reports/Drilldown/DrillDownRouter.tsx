"use client"

import * as React from "react"
import DrillDownModal from "./DrillDownModal"
import { ProductDrillDownContent } from "./ProductDrillDown"
import { ClientDrillDownContent } from "./ClientDrillDown"
import { IndustryDrillDownContent } from "./IndustryDrillDown"
import { TimeDrillDownContent } from "./TimeDrillDown"
import { AMCDrillDownContent } from "./AMCDrillDown"
import { DrillDownResponse } from "@/redux/api/report"

interface DrillDownRouterProps {
  open: boolean
  onClose: () => void
  data?: DrillDownResponse
  isLoading?: boolean
  error?: string
}

const DrillDownRouter: React.FC<DrillDownRouterProps> = ({
  open,
  onClose,
  data,
  isLoading,
  error,
}) => {
  const getDrillDownContent = (type: string, drillDownData: DrillDownResponse) => {
    switch (type) {
      case "product":
        return ProductDrillDownContent({ data: drillDownData })
      case "client":
        return ClientDrillDownContent({ data: drillDownData })
      case "industry":
        return IndustryDrillDownContent({ data: drillDownData })
      case "time":
        return TimeDrillDownContent({ data: drillDownData })
      case "amc":
        return AMCDrillDownContent({ data: drillDownData })
      default:
        return { summary: <div>Unknown drill-down type</div>, details: null }
    }
  }

  return (
    <DrillDownModal
      open={open}
      onClose={onClose}
      data={data}
      isLoading={isLoading}
      error={error}
      children={data ? getDrillDownContent(data.metadata.drilldownType, data) : { summary: null, details: null }}
    />
  )
}

export default DrillDownRouter
