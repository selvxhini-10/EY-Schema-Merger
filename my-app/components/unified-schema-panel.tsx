"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
// ...existing code...
type ApprovalState = "none" | "approved" | "rejected";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  SchemaField,
  Mapping,
} from "@/components/schema-mapping-workspace";

type UnifiedSchemaPanelProps = {
  fields: SchemaField[];
  mappings: Mapping[];
  onApproveMapping: (mappingId: string) => void;
  tableApproval: Record<string, "none" | "approved" | "rejected">;
  setTableApproval: React.Dispatch<React.SetStateAction<Record<string, "none" | "approved" | "rejected">>>;
};

type TableMapping = {
  tableName: string;
  status: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
  }>;
  columnMappings: Array<{
    id: string;
    bankAColumn: string;
    bankBColumn: string;
    unifiedColumn: string;
    confidence: "high" | "medium" | "low";
    status: string;
    approved: boolean;
  }>;
};

type SchemaData = {
  tables: TableMapping[];
  bank1Schema: any;
  bank2Schema: any;
};

export function UnifiedSchemaPanel({
  fields,
  mappings,
  onApproveMapping,
  tableApproval,
  setTableApproval,
}: UnifiedSchemaPanelProps) {
  const [schemaData, setSchemaData] = useState<SchemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Calculate approval progress
  const confirmedTables = schemaData?.tables.filter((table) => table.status === "Confident Match") || [];
  const approvedCount = confirmedTables.filter((table) => tableApproval[table.tableName] === "approved").length;
  const progress = confirmedTables.length > 0 ? Math.round((approvedCount / confirmedTables.length) * 100) : 0;

  useEffect(() => {
    const fetchSchemaData = async () => {
      try {
        const response = await fetch("/api/schemas");
        if (!response.ok) {
          throw new Error("Failed to fetch schema data");
        }
        const data = await response.json();
        setSchemaData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSchemaData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confident Match":
        return "bg-green-100 text-green-800 border-green-200";
      case "Needs Review":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-red-100 text-red-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Confident Match":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Needs Review":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading schema data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!schemaData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No schema data available</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-foreground text-center">
        Confirmed Unified Tables
      </h3>
      {/* Approval Progress Bar */}
      <div className="flex items-center gap-4 mb-4 max-w-2xl mx-auto">
        <span className="text-sm font-medium">Approval Progress</span>
        <div className="flex-1">
          <Progress value={progress} />
        </div>
        <span className="text-xs text-muted-foreground">{progress}%</span>
      </div>
      <div className="space-y-4 max-w-2xl mx-auto">
        {confirmedTables.map((table) => (
          <Card key={table.tableName} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {table.tableName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusIcon(table.status)}
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(table.status)}`}
                  >
                    {table.status}
                  </Badge>
                  {/* Approval buttons */}
                  <button
                    aria-label="Approve"
                    className={`ml-2 rounded-full p-1 border ${tableApproval[table.tableName] === "approved" ? "bg-green-100 border-green-400" : "hover:bg-green-50 border-gray-300"}`}
                    onClick={() => setTableApproval((prev) => ({ ...prev, [table.tableName]: "approved" }))}
                  >
                    <Check className={`h-4 w-4 ${tableApproval[table.tableName] === "approved" ? "text-green-600" : "text-gray-400"}`} />
                  </button>
                  <button
                    aria-label="Reject"
                    className={`ml-1 rounded-full p-1 border ${tableApproval[table.tableName] === "rejected" ? "bg-red-100 border-red-400" : "hover:bg-red-50 border-gray-300"}`}
                    onClick={() => setTableApproval((prev) => ({ ...prev, [table.tableName]: "rejected" }))}
                  >
                    <X className={`h-4 w-4 ${tableApproval[table.tableName] === "rejected" ? "text-red-600" : "text-gray-400"}`} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Show Bank 1 columns that don't need review */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Bank 1 Fields ({table.fields.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {table.fields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-muted rounded px-2 py-1"
                    >
                      <span className="font-mono text-xs truncate block">
                        {field.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
