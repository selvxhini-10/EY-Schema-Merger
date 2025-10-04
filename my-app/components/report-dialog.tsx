"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"
import { generateMappingReport } from "@/lib/export-utils"
import type { Mapping } from "@/components/schema-mapping-workspace"

type ReportDialogProps = {
  mappings: Mapping[]
  trigger?: React.ReactNode
}

export function ReportDialog({ mappings, trigger }: ReportDialogProps) {
  const [open, setOpen] = useState(false)

  const handleGenerateReport = () => {
    generateMappingReport(mappings)
    setOpen(false)
  }

  const totalMappings = mappings.length
  const approvedMappings = mappings.filter((m) => m.approved).length
  const highConfidence = mappings.filter((m) => m.confidence === "high").length
  const mediumConfidence = mappings.filter((m) => m.confidence === "medium").length
  const lowConfidence = mappings.filter((m) => m.confidence === "low").length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Mapping Documentation Report</DialogTitle>
          <DialogDescription>
            Create an audit-ready report documenting all schema mappings, confidence scores, and conflicts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="font-semibold text-sm mb-3 text-foreground">Report Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Mappings:</span>
                <span className="font-medium text-foreground">{totalMappings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approved Mappings:</span>
                <span className="font-medium text-foreground">{approvedMappings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">High Confidence:</span>
                <span className="font-medium text-success">{highConfidence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medium Confidence:</span>
                <span className="font-medium text-warning">{mediumConfidence}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low Confidence:</span>
                <span className="font-medium text-destructive">{lowConfidence}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-2 text-card-foreground">Report Contents</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Executive summary with key metrics</li>
              <li>Complete mapping table (source → target)</li>
              <li>Confidence scores for each mapping</li>
              <li>Approval status for all mappings</li>
              <li>Recommendations for unresolved conflicts</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerateReport}>
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
