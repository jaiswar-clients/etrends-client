"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DrillDownResponse } from "@/redux/api/report"

interface DrillDownModalProps {
  open: boolean
  onClose: () => void
  data?: DrillDownResponse
  isLoading?: boolean
  error?: string
  children: {
    summary: React.ReactNode
    details: React.ReactNode
  }
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({
  open,
  onClose,
  data,
  isLoading = false,
  error,
  children,
}) => {
  const getDrillDownTitle = (type: string, value?: string) => {
    const titles: Record<string, string> = {
      product: "Product Revenue Breakdown",
      client: "Client Revenue Breakdown",
      industry: "Industry Revenue Breakdown",
      time: "Revenue Over Time",
      amc: "AMC Collection Analysis",
    }
    return value ? `${titles[type] || "Drill Down"}: ${value}` : titles[type] || "Drill Down"
  }

  const hasDetails = data?.details && data.details.length > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? (
              "Loading..."
            ) : data ? (
              getDrillDownTitle(data.metadata.drilldownType, data.metadata.drilldownValue)
            ) : (
              "Drill Down"
            )}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? "Fetching drill-down data..." : (
              data?.metadata.period ? `Period: ${data.metadata.period}` : "Detailed view of selected data"
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-destructive">Error loading drill-down data</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        ) : data ? (
          <Tabs defaultValue="summary" className="flex flex-col h-full">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              {hasDetails && <TabsTrigger value="details">Details ({data.details?.length || 0})</TabsTrigger>}
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-auto">
              {children.summary}
            </TabsContent>

            {hasDetails && (
              <TabsContent value="details" className="flex-1 overflow-auto">
                {children.details}
              </TabsContent>
            )}
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export default DrillDownModal
