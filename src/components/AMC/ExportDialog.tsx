import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, FileDown, Loader2 } from 'lucide-react'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  filterInfo: {
    filters: string[]
    dateRange: { startDate: Date | null; endDate: Date | null }
    clientName?: string
    productName?: string
    financialYear?: string
  }
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  filterInfo
}) => {
  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Not specified'
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Map filter names to more readable versions
  const getFilterName = (filter: string) => {
    const filterMap: Record<string, string> = {
      'paid': 'Paid',
      'pending': 'Pending',
      'proforma': 'Proforma',
      'invoice': 'Invoice'
    }
    return filterMap[filter] || filter
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Export AMC Data to Excel
          </DialogTitle>
          <DialogDescription>
            This will generate an Excel file with the currently filtered AMC data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h4 className="text-sm font-medium mb-2">Export will include the following filters:</h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2 bg-muted/50 p-2 rounded-md">
              <div className="font-medium min-w-24">AMC Types:</div>
              <div className="flex flex-wrap gap-1">
                {filterInfo.filters.length > 0 ? (
                  filterInfo.filters.map(filter => (
                    <span key={filter} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {getFilterName(filter)}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 italic">No filters selected (defaults to All)</span>
                )}
              </div>
            </div>
            
            <div className="flex items-start gap-2 bg-muted/50 p-2 rounded-md">
              <div className="font-medium min-w-24">Date Range:</div>
              <div>
                {filterInfo.financialYear ? (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {filterInfo.financialYear}
                  </span>
                ) : (
                  <span>
                    {formatDate(filterInfo.dateRange.startDate)} to {formatDate(filterInfo.dateRange.endDate)}
                  </span>
                )}
              </div>
            </div>
            
            {filterInfo.clientName && (
              <div className="flex items-start gap-2 bg-muted/50 p-2 rounded-md">
                <div className="font-medium min-w-24">Client:</div>
                <div>{filterInfo.clientName}</div>
              </div>
            )}
            
            {filterInfo.productName && (
              <div className="flex items-start gap-2 bg-muted/50 p-2 rounded-md">
                <div className="font-medium min-w-24">Product:</div>
                <div>{filterInfo.productName}</div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Download Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportDialog 