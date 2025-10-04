"use client"
import { Button } from "@/components/ui/button"
import { Upload, Sparkles, CheckCheck } from "lucide-react"
import { ExportDialog } from "@/components/export-dialog"
import { ReportDialog } from "@/components/report-dialog"
import type { Mapping } from "@/components/schema-mapping-workspace"
import { useRef, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { listZipFiles } from "@/lib/list-zip-files"
import { fileToCsv } from "@/lib/file-to-csv"

// Remove mockMappings. Bank A/B schema cards will start empty.



export function TopBar() {
  const bankAInputRef = useRef<HTMLInputElement>(null)
  const bankBInputRef = useRef<HTMLInputElement>(null)
  const [bankAFiles, setBankAFiles] = useState<{ name: string, isFolder: boolean, csv?: string, zipEntries?: string[] }[]>([])
  const [bankBFiles, setBankBFiles] = useState<{ name: string, isFolder: boolean, csv?: string, zipEntries?: string[] }[]>([])
  const [showProgress, setShowProgress] = useState(false)
  const [progress, setProgress] = useState(0)

  // Only show progress bar during upload/conversion
  const handleUploadProgress = (val: number) => {
    setShowProgress(val < 100)
    setProgress(val)
  }
  const handleUploadVisible = (visible: boolean) => {
    setShowProgress(visible)
    if (!visible) setProgress(0)
  }
  const handleUploadBankA = () => {
    bankAInputRef.current?.click()
  }

  const handleUploadBankB = () => {
    bankBInputRef.current?.click()
  }

  const handleBankAChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    const items: { name: string, isFolder: boolean, csv?: string, zipEntries?: string[] }[] = []
    for (const file of files) {
      const isFolder = !!(file.webkitRelativePath && file.webkitRelativePath.split("/").length > 2)
      let csv: string | undefined = undefined
      let zipEntries: string[] | undefined = undefined
      if (file.name.endsWith('.zip')) {
        try {
          zipEntries = await listZipFiles(file)
        } catch {}
      }
      try {
        csv = await fileToCsv(file)
      } catch {}
      items.push({ name: isFolder ? file.webkitRelativePath.split("/")[1] : file.name, isFolder, csv, zipEntries })
    }
    setBankAFiles(items)
  }

  const handleBankBChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    const items: { name: string, isFolder: boolean, csv?: string, zipEntries?: string[] }[] = []
    for (const file of files) {
      const isFolder = !!(file.webkitRelativePath && file.webkitRelativePath.split("/").length > 2)
      let csv: string | undefined = undefined
      let zipEntries: string[] | undefined = undefined
      if (file.name.endsWith('.zip')) {
        try {
          zipEntries = await listZipFiles(file)
        } catch {}
      }
      try {
        csv = await fileToCsv(file)
      } catch {}
      items.push({ name: isFolder ? file.webkitRelativePath.split("/")[1] : file.name, isFolder, csv, zipEntries })
    }
    setBankBFiles(items)
  }

  const handleRunAIMapping = () => {
    // AI mapping logic will be implemented here
    console.log("[v0] Run AI mapping")
  }

  const handleApproveAll = () => {
    // Approve all logic
    console.log("[v0] Approve all mappings")
  }

  return (
    <>
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
            <input
              ref={bankAInputRef}
              type="file"
              style={{ display: 'none' }}
              multiple
              onChange={handleBankAChange}
              accept=".zip,application/zip,application/x-zip-compressed,.json,.csv,.txt"
              {...({ webkitdirectory: 'true' } as any)}
              onClick={e => { (e.target as HTMLInputElement).value = '' }}
            />
            <input
              ref={bankBInputRef}
              type="file"
              style={{ display: 'none' }}
              multiple
              onChange={handleBankBChange}
              accept=".zip,application/zip,application/x-zip-compressed,.json,.csv,.txt"
              {...({ webkitdirectory: 'true' } as any)}
              onClick={e => { (e.target as HTMLInputElement).value = '' }}
            />
            <Button variant="outline" size="sm" onClick={handleUploadBankA}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Bank A
            </Button>
            <Button variant="outline" size="sm" onClick={handleUploadBankB}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Bank B
            </Button>
        {/* Display uploaded Bank A files */}
        {bankAFiles.length > 0 && (
          <div className="w-full max-w-xs mt-2">
            <div className="font-semibold text-xs mb-1">Bank A Uploaded Items:</div>
            <div className="w-full max-h-32 overflow-auto border rounded bg-background">
              <ul className="w-full flex flex-col gap-1 p-2">
                {bankAFiles.map((item, idx) => (
                  <li key={idx} className="bg-muted rounded px-2 py-1 text-xs max-w-full truncate" title={item.name}>
                    {item.isFolder ? '📁 ' : '📄 '}{item.name}
                    {item.zipEntries && item.zipEntries.length > 0 && (
                      <ul className="ml-4 mt-1 max-h-16 overflow-auto border-l border-border pl-2">
                        {item.zipEntries.map((entry, i) => (
                          <li key={i} className="truncate" title={entry}>📄 {entry}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {/* Display uploaded Bank B files */}
        {bankBFiles.length > 0 && (
          <div className="w-full max-w-xs mt-2">
            <div className="font-semibold text-xs mb-1">Bank B Uploaded Items:</div>
            <div className="w-full max-h-32 overflow-auto border rounded bg-background">
              <ul className="w-full flex flex-col gap-1 p-2">
                {bankBFiles.map((item, idx) => (
                  <li key={idx} className="bg-muted rounded px-2 py-1 text-xs max-w-full truncate" title={item.name}>
                    {item.isFolder ? '📁 ' : '📄 '}{item.name}
                    {item.zipEntries && item.zipEntries.length > 0 && (
                      <ul className="ml-4 mt-1 max-h-16 overflow-auto border-l border-border pl-2">
                        {item.zipEntries.map((entry, i) => (
                          <li key={i} className="truncate" title={entry}>📄 {entry}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
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
            <ReportDialog mappings={[]} />
          </div>
        </div>
      </div>
      </header>
      {showProgress && (
        <div className="w-full bg-card border-b border-border">
          <div className="container mx-auto px-6 py-2">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}
    </>
  )
}
