"use client";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCheck } from "lucide-react";
import { ExportDialog } from "@/components/export-dialog";
import { ReportDialog } from "@/components/report-dialog";
import type { SchemaField } from "@/components/schema-mapping-workspace";

// Remove mockMappings. Bank A/B schema cards will start empty.

interface TopBarProps {
  setBankASchema: React.Dispatch<React.SetStateAction<SchemaField[]>>;
  setBankBSchema: React.Dispatch<React.SetStateAction<SchemaField[]>>;
}

export function TopBar({ setBankASchema, setBankBSchema }: TopBarProps) {
  const handleRunAIMapping = () => {
    // AI mapping logic will be implemented here
    console.log("[v0] Run AI mapping");
  };

  const handleApproveAll = () => {
    // Approve all logic
    console.log("[v0] Approve all mappings");
  };

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
                  <h1 className="text-lg font-semibold text-card-foreground">
                    Schema Mapper
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    AI-Driven Integration Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
    </>
  );
}
