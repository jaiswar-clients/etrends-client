"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

interface DuplicateRecord {
  id: string
  type: string
  description: string
}

interface DuplicateWarningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicateRecords: DuplicateRecord[]
  onProceed: () => void
  onCancel: () => void
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  duplicateRecords,
  onProceed,
  onCancel,
}: DuplicateWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Duplicate Purchase Warning</DialogTitle>
          </div>
          <DialogDescription>
            Potential duplicate purchases found. Please review the details below before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm font-medium mb-3">
            {duplicateRecords.length} potential duplicate{duplicateRecords.length > 1 ? 's' : ''} found:
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {duplicateRecords.map((record, index) => (
              <div key={`${record.id}-${index}`} className="flex gap-3 p-2 bg-muted rounded">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{record.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {record.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            You can still proceed with creating this record, but please verify that this is not a duplicate entry.
          </p>
        </div>

        <DialogFooter className="flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => {
              onCancel()
              onOpenChange(false)
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onProceed()
              onOpenChange(false)
            }}
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
