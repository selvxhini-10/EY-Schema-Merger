
"use client"
import { UploadContainerCard } from "@/components/upload-container-card"

import { useState } from "react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TopBar from "@/components/top-bar"
import type { SchemaField } from "@/components/schema-mapping-workspace"
import { SchemaMappingWorkspace } from "@/components/schema-mapping-workspace"
import { MergedDataPreview } from "@/components/merged-data-preview"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

import PipelineLogConsole from "@/components/pipeline-log-console"

export default function Home() {
  const [activeTab, setActiveTab] = useState("mapping")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadVisible, setUploadVisible] = useState(false)
  const [bankASchema, setBankASchema] = useState<SchemaField[]>([])
  const [bankBSchema, setBankBSchema] = useState<SchemaField[]>([])
 // Upload master schema to /schemas/parse
  const handleMasterSchemaUpload = async (bank: "A" | "B") => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".xlsx,.xls"
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return
      const file = input.files[0]

      const formData = new FormData()
      formData.append("files", file) // /schemas/parse expects List[UploadFile]
      try {
        const response = await axios.post("http://localhost:8000/schemas/parse", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        console.log("Master schema uploaded:", response.data)
        alert(`✅ File '${file.name}' uploaded and parsed successfully!`)
        // Optionally, update state if you want to populate the workspace
        if (bank === "A") setBankASchema(response.data.parsed[0]?.fields || [])
        if (bank === "B") setBankBSchema(response.data.parsed[0]?.fields || [])
      } catch (error) {
        console.error("Failed to upload master schema:", error)
        alert(`❌ Failed to upload '${file.name}'. Check backend logs and try again.`)
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar setBankASchema={setBankASchema} setBankBSchema={setBankBSchema} />
      <main className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
            <TabsTrigger value="mapping">Schema Mapping</TabsTrigger>
            <TabsTrigger value="preview">Data Preview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

        <TabsContent value="mapping" className="mt-0">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 border rounded-lg p-4 bg-muted">
                <h2 className="font-semibold mb-2">Upload Bank A Master Schema</h2>
                <button
                  className="mb-4 px-4 py-2 bg-primary text-white rounded"
                  onClick={() => handleMasterSchemaUpload("A")}
                >
                  Upload Bank A Master Schema
                </button>
                <UploadContainerCard
                  bank="A"
                  onUploadProgress={setUploadProgress}
                  onUploadVisible={setUploadVisible}
                />
              </div>

              <div className="flex-1 border rounded-lg p-4 bg-muted">
                <h2 className="font-semibold mb-2">Upload Bank B Master Schema</h2>
                <button
                  className="mb-4 px-4 py-2 bg-primary text-white rounded"
                  onClick={() => handleMasterSchemaUpload("B")}
                >
                  Upload Bank B Master Schema
                </button>
                <UploadContainerCard
                  bank="B"
                  onUploadProgress={setUploadProgress}
                  onUploadVisible={setUploadVisible}
                />
              </div>
            </div>

            {/* Pipeline log console between upload and workspace */}
            <PipelineLogConsole />

            <div className="mt-8">
              <SchemaMappingWorkspace bankASchema={bankASchema} bankBSchema={bankBSchema} />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <MergedDataPreview />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
