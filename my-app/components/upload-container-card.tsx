import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadProgressBar } from "@/components/upload-progress-bar"

export function UploadContainerCard({
  onUploadProgress,
  onUploadVisible,
  children
}: {
  onUploadProgress?: (progress: number) => void
  onUploadVisible?: (visible: boolean) => void
  children?: React.ReactNode
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) {
      setVisible(true)
      setProgress(0)
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setProgress(progress)
        if (onUploadProgress) onUploadProgress(progress)
        if (progress >= 100) {
          clearInterval(interval)
          setTimeout(() => setVisible(false), 500)
          if (onUploadVisible) onUploadVisible(false)
        }
      }, 100)
      if (onUploadVisible) onUploadVisible(true)
    }
  }

  return (
    <Card
      className={`w-full min-h-[300px] flex flex-col justify-center items-center mb-8 border-dashed border-2 ${isDragOver ? 'border-primary bg-muted' : 'border-border bg-card'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle>Upload Files</CardTitle>
      </CardHeader>
      <CardContent className="w-full flex flex-col items-center">
        <UploadProgressBar progress={progress} visible={visible} />
        <div className="text-muted-foreground text-center py-8">
          Drag and drop files here to upload
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
