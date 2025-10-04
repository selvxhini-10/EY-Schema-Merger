import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SchemaField } from "@/components/schema-mapping-workspace"

type SchemaPanelProps = {
  title: string
  fields: SchemaField[]
  color: "blue" | "purple"
}

export function SchemaPanel({ title, fields, color }: SchemaPanelProps) {
  const colorClasses = {
    blue: "border-l-4 border-l-chart-4",
    purple: "border-l-4 border-l-chart-1",
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-foreground">{title}</h3>
      <div className="space-y-2">
        {fields.map((field) => (
          <Card key={field.id} className={`${colorClasses[color]} hover:shadow-md transition-shadow`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium text-card-foreground truncate">{field.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{field.sampleValue}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  {field.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
