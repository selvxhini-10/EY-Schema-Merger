"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import type { SchemaField, Mapping } from "@/components/schema-mapping-workspace"

type UnifiedSchemaPanelProps = {
  fields: SchemaField[]
  mappings: Mapping[]
  onApproveMapping: (mappingId: string) => void
}

export function UnifiedSchemaPanel({ fields, mappings, onApproveMapping }: UnifiedSchemaPanelProps) {
  const getFieldMappings = (fieldName: string) => {
    return mappings.filter((m) => m.targetField === fieldName)
  }

  const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return "bg-success text-white"
      case "medium":
        return "bg-warning text-white"
      case "low":
        return "bg-destructive text-white"
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-foreground">Unified Schema</h3>
      <div className="space-y-2">
        {fields.map((field) => {
          const fieldMappings = getFieldMappings(field.name)

          return (
            <Card key={field.id} className="border-l-4 border-l-accent">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold text-card-foreground truncate">{field.name}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {field.type}
                  </Badge>
                </div>

                {fieldMappings.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {fieldMappings.map((mapping) => (
                      <div key={mapping.id} className="flex items-center gap-2 text-xs bg-muted rounded p-2">
                        <div className="flex-1 min-w-0">
                          <span className="font-mono truncate block">{mapping.sourceField}</span>
                        </div>
                        <Badge className={`text-xs ${getConfidenceColor(mapping.confidence)}`}>
                          {mapping.confidence}
                        </Badge>
                        <Button
                          size="sm"
                          variant={mapping.approved ? "default" : "outline"}
                          className="h-6 w-6 p-0"
                          onClick={() => onApproveMapping(mapping.id)}
                        >
                          {mapping.approved ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
