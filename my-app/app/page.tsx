"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TopBar } from "@/components/top-bar"
import { SchemaMappingWorkspace } from "@/components/schema-mapping-workspace"
import { MergedDataPreview } from "@/components/merged-data-preview"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { UploadContainerCard } from "@/components/upload-container-card"

export default function Home() {
  const [activeTab, setActiveTab] = useState("mapping")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadVisible, setUploadVisible] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
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
                <h2 className="font-semibold mb-2">Upload Bank A Data</h2>
                <UploadContainerCard
                  bank="A"
                  onUploadProgress={setUploadProgress}
                  onUploadVisible={setUploadVisible}
                />
              </div>
              <div className="flex-1 border rounded-lg p-4 bg-muted">
                <h2 className="font-semibold mb-2">Upload Bank B Data</h2>
                <UploadContainerCard
                  bank="B"
                  onUploadProgress={setUploadProgress}
                  onUploadVisible={setUploadVisible}
                />
              </div>
            </div>
            <div className="mt-8">
              <SchemaMappingWorkspace />
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
