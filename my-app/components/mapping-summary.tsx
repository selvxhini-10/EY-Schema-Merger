import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Mapping } from "@/components/schema-mapping-workspace"

type MappingSummaryProps = {
  mappings: Mapping[];
  tableCompletion?: number;
  approvedTables?: number;
  totalTables?: number;
}

export function MappingSummary({ mappings, tableCompletion, approvedTables, totalTables }: MappingSummaryProps) {
  const totalMappings = mappings.length
  const approvedMappings = mappings.filter((m) => m.approved).length
  const completionPercentage = totalMappings > 0 ? (approvedMappings / totalMappings) * 100 : 0

  const highConfidence = mappings.filter((m) => m.confidence === "high").length
  const mediumConfidence = mappings.filter((m) => m.confidence === "medium").length
  const lowConfidence = mappings.filter((m) => m.confidence === "low").length

  const avgConfidence =
    totalMappings > 0
      ? ((highConfidence * 100 + mediumConfidence * 60 + lowConfidence * 30) / totalMappings).toFixed(0)
      : 0

  const unresolvedConflicts = mappings.filter((m) => !m.approved && m.confidence === "low").length

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-base">Mapping Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Completion</span>
            <span className="text-sm font-semibold text-foreground">{tableCompletion !== undefined ? tableCompletion.toFixed(0) : completionPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={tableCompletion !== undefined ? tableCompletion : completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {approvedTables !== undefined && totalTables !== undefined
              ? `${approvedTables} of ${totalTables} tables approved`
              : `${approvedMappings} of ${totalMappings} mappings approved`}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Avg Confidence</span>
            <span className="text-lg font-semibold text-foreground">{avgConfidence}%</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Unresolved Conflicts</span>
            <span className="text-lg font-semibold text-destructive">{unresolvedConflicts}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Confidence Breakdown</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-success" />
                <span className="text-muted-foreground">High</span>
              </div>
              <span className="font-medium text-foreground">{highConfidence}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-warning" />
                <span className="text-muted-foreground">Medium</span>
              </div>
              <span className="font-medium text-foreground">{mediumConfidence}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Low</span>
              </div>
              <span className="font-medium text-foreground">{lowConfidence}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
