"use client"

import { Button } from "@/components/ui/button"
import { Upload, Sparkles, CheckCheck } from "lucide-react"
import { ExportDialog } from "@/components/export-dialog"
import { ReportDialog } from "@/components/report-dialog"
import type { Mapping } from "@/components/schema-mapping-workspace"

// Mock mappings for the report dialog
const mockMappings: Mapping[] = [
  { id: "m1", sourceField: "customer_id", targetField: "CustomerID", confidence: "high", approved: false },
  { id: "m2", sourceField: "ClientID", targetField: "CustomerID", confidence: "high", approved: false },
  { id: "m3", sourceField: "full_name", targetField: "FirstName", confidence: "medium", approved: false },
  { id: "m4", sourceField: "FirstName", targetField: "FirstName", confidence: "high", approved: false },
  { id: "m5", sourceField: "LastName", targetField: "LastName", confidence: "high", approved: false },
  { id: "m6", sourceField: "birth_date", targetField: "DateOfBirth", confidence: "high", approved: false },
  { id: "m7", sourceField: "DOB", targetField: "DateOfBirth", confidence: "high", approved: false },
  { id: "m8", sourceField: "acct_type", targetField: "AccountType", confidence: "medium", approved: false },
  { id: "m9", sourceField: "AccountType", targetField: "AccountType", confidence: "high", approved: false },
  { id: "m10", sourceField: "balance_amt", targetField: "Balance", confidence: "high", approved: false },
  { id: "m11", sourceField: "CurrentBalance", targetField: "Balance", confidence: "high", approved: false },
  { id: "m12", sourceField: "branch_code", targetField: "Location", confidence: "low", approved: false },
  { id: "m13", sourceField: "Region", targetField: "Location", confidence: "medium", approved: false },
]

export function TopBar() {
  const handleUploadBankA = () => {
    console.log("[v0] Upload Bank A schema")
  }

  const handleUploadBankB = () => {
    console.log("[v0] Upload Bank B schema")
  }

  const handleRunAIMapping = () => {
    console.log("[v0] Run AI mapping")
  }

  const handleApproveAll = () => {
    console.log("[v0] Approve all mappings")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-card-foreground">Schema Mapper</h1>
                <p className="text-xs text-muted-foreground">AI-Driven Integration Platform</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleUploadBankA}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Bank A
            </Button>
            <Button variant="outline" size="sm" onClick={handleUploadBankB}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Bank B
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button size="sm" onClick={handleRunAIMapping}>
              <Sparkles className="h-4 w-4 mr-2" />
              Run AI Mapping
            </Button>
            <Button variant="outline" size="sm" onClick={handleApproveAll}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Approve All
            </Button>
            <ExportDialog />
            <ReportDialog mappings={mockMappings} />
          </div>
        </div>
      </div>
    </header>
  )
}
