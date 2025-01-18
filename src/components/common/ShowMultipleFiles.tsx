"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useFileUpload } from "@/hooks/useFileUpload"

interface ShowMultipleFilesModalProps {
  files: string[]
  getFileNameFromUrl: (url: string) => string
  triggerText?: string
}

export default function ShowMultipleFilesModal({ 
  files, 
  triggerText = "View Files" 
}: ShowMultipleFilesModalProps) {
  const { getFileNameFromUrl } = useFileUpload()
  const [open, setOpen] = useState(false)

  if (!files?.length) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Files</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-md border">
              <span className="text-sm text-gray-600">
                {getFileNameFromUrl(file)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file, '_blank')}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

