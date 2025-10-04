import { Progress } from "@/components/ui/progress"

export function UploadProgressBar({ progress, visible }: { progress: number; visible: boolean }) {
  if (!visible) return null
  return (
    <div className="w-full bg-background border-b border-border">
      <div className="container mx-auto px-6 pt-2 pb-1">
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  )
}
