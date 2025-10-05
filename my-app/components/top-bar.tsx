"use client";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCheck, Download, FileText, Info } from "lucide-react";
import { useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExportDialog } from "@/components/export-dialog";
import { ReportDialog } from "@/components/report-dialog";
import { listZipFiles } from "@/lib/list-zip-files";
import { fileToCsv } from "@/lib/file-to-csv";
import { read, utils } from "xlsx";

// Schema Sync color palette
const COLORS = {
  primary: "#2DD4BF", // Teal
  secondary: "#3B82F6", // Blue
  dark: "#0F172A",
  light: "#F1F5F9",
};

interface SchemaField {
  id: string;
  name: string;
  type: string;
  sampleValue: string;
}

interface TopBarProps {
  setBankASchema: React.Dispatch<React.SetStateAction<SchemaField[]>>;
  setBankBSchema: React.Dispatch<React.SetStateAction<SchemaField[]>>;
}

export default function TopBar({
  setBankASchema,
  setBankBSchema,
}: TopBarProps) {
  const bankAInputRef = useRef<HTMLInputElement>(null);
  const bankBInputRef = useRef<HTMLInputElement>(null);
  // Use the advanced file state from the original for .zip/csv/xlsx
  const [bankAFiles, setBankAFiles] = useState<
    { name: string; isFolder: boolean; zipEntries?: string[] }[]
  >([]);
  const [bankBFiles, setBankBFiles] = useState<
    { name: string; isFolder: boolean; zipEntries?: string[] }[]
  >([]);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUploadBankA = () => {
    bankAInputRef.current?.click();
  };

  const handleUploadBankB = () => {
    bankBInputRef.current?.click();
  };

  // Use robust file parsing and schema extraction from the original
  const handleBankAChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const items: { name: string; isFolder: boolean; zipEntries?: string[] }[] =
      [];
    let allSchemaFields: SchemaField[] = [];
    for (const file of files) {
      const isFolder = !!(
        file.webkitRelativePath && file.webkitRelativePath.split("/").length > 2
      );
      let zipEntries: string[] | undefined = undefined;
      let schemaFields: SchemaField[] | undefined = undefined;
      if (file.name.endsWith(".zip")) {
        try {
          zipEntries = await listZipFiles(file);
        } catch {}
      }
      try {
        if (
          file.name.endsWith(".csv") ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        ) {
          const data = await file.arrayBuffer();
          const workbook = read(new Uint8Array(data), { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = utils.sheet_to_json(sheet, { header: 1 });
          const dataRows = jsonData as any[][];
          if (dataRows.length > 0 && dataRows[0].length === 1) {
            schemaFields = dataRows.slice(0).map((row, index) => ({
              id: `field-${index}`,
              name: row[0] || `Column-${index}`,
              type: "string",
              sampleValue: "",
            }));
          } else {
            schemaFields = dataRows.slice(1).map((row, index) => ({
              id: `field-${index}`,
              name: row[0] || `Column-${index}`,
              type: typeof row[1],
              sampleValue: row[1]?.toString() || "",
            }));
          }
          allSchemaFields = allSchemaFields.concat(schemaFields);
        }
      } catch {}
      items.push({
        name: isFolder ? file.webkitRelativePath.split("/")[1] : file.name,
        isFolder,
        zipEntries,
      });
    }
    setBankAFiles(items);
    setBankASchema(allSchemaFields);
  };

  const handleBankBChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const items: { name: string; isFolder: boolean; zipEntries?: string[] }[] =
      [];
    let allSchemaFields: SchemaField[] = [];
    for (const file of files) {
      const isFolder = !!(
        file.webkitRelativePath && file.webkitRelativePath.split("/").length > 2
      );
      let zipEntries: string[] | undefined = undefined;
      let schemaFields: SchemaField[] | undefined = undefined;
      if (file.name.endsWith(".zip")) {
        try {
          zipEntries = await listZipFiles(file);
        } catch {}
      }
      try {
        if (
          file.name.endsWith(".csv") ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        ) {
          const data = await file.arrayBuffer();
          const workbook = read(new Uint8Array(data), { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = utils.sheet_to_json(sheet, { header: 1 });
          const dataRows = jsonData as any[][];
          if (dataRows.length > 0 && dataRows[0].length === 1) {
            schemaFields = dataRows.slice(0).map((row, index) => ({
              id: `field-${index}`,
              name: row[0] || `Column-${index}`,
              type: "string",
              sampleValue: "",
            }));
          } else {
            schemaFields = dataRows.slice(1).map((row, index) => ({
              id: `field-${index}`,
              name: row[0] || `Column-${index}`,
              type: typeof row[1],
              sampleValue: row[1]?.toString() || "",
            }));
          }
          allSchemaFields = allSchemaFields.concat(schemaFields);
        }
      } catch {}
      items.push({
        name: isFolder ? file.webkitRelativePath.split("/")[1] : file.name,
        isFolder,
        zipEntries,
      });
    }
    setBankBFiles(items);
    setBankBSchema(allSchemaFields);
  };

  const handleRunAIMapping = () => {
    console.log("Run AI mapping");
  };

  const handleApproveAll = () => {
    console.log("Approve all mappings");
  };

  return (
    <>
      {/* Header */}
      <header
        className="border-b bg-white shadow-sm"
        style={{ borderColor: "#E2E8F0" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="relative w-10 h-10">
                  <img
                    src="/logo.png"
                    alt="Schema Sync Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1
                    className="text-xl font-bold"
                    style={{ color: COLORS.dark }}
                  >
                    Schema Sync
                  </h1>
                  <p className="text-xs" style={{ color: "#64748B" }}>
                    AI-Powered Data Integration
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <input
                ref={bankAInputRef}
                type="file"
                style={{ display: "none" }}
                multiple
                onChange={handleBankAChange}
                accept=".zip,application/zip,application/x-zip-compressed,.json,.csv,.xlsx,.xls,.txt"
                {...({ webkitdirectory: "true" } as any)}
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = "";
                }}
              />
              <input
                ref={bankBInputRef}
                type="file"
                style={{ display: "none" }}
                multiple
                onChange={handleBankBChange}
                accept=".zip,application/zip,application/x-zip-compressed,.json,.csv,.xlsx,.xls,.txt"
                {...({ webkitdirectory: "true" } as any)}
                onClick={(e) => {
                  (e.target as HTMLInputElement).value = "";
                }}
              />
              {/* Removed Upload Buttons for Bank A and Bank B */}
              <div className="w-px h-6 bg-gray-300 mx-2" />
              <Button
                size="sm"
                onClick={handleRunAIMapping}
                style={{ backgroundColor: COLORS.primary, color: "white" }}
                className="hover:opacity-90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Run AI Mapping
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApproveAll}
                className="border-2"
                style={{ borderColor: "#10B981", color: "#10B981" }}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Approve All
              </Button>
              <ExportDialog />
              <ReportDialog mappings={[]} />
            </div>
          </div>

          {/* File Upload Status */}
          <div className="flex gap-4 mt-4">
            {bankAFiles.length > 0 && (
              <div className="flex-1">
                <div
                  className="text-xs font-semibold mb-1"
                  style={{ color: COLORS.primary }}
                >
                  Bank A Files ({bankAFiles.length})
                </div>
                <div className="bg-gray-50 rounded p-2 max-h-20 overflow-auto">
                  {bankAFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs truncate"
                      style={{ color: "#475569" }}
                    >
                      {item.isFolder ? "📁 " : "📄 "}
                      {item.name}
                      {item.zipEntries && item.zipEntries.length > 0 && (
                        <ul className="ml-4 mt-1 max-h-16 overflow-auto border-l border-border pl-2">
                          {item.zipEntries.map((entry, i) => (
                            <li key={i} className="truncate" title={entry}>
                              📄 {entry}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {bankBFiles.length > 0 && (
              <div className="flex-1">
                <div
                  className="text-xs font-semibold mb-1"
                  style={{ color: COLORS.secondary }}
                >
                  Bank B Files ({bankBFiles.length})
                </div>
                <div className="bg-gray-50 rounded p-2 max-h-20 overflow-auto">
                  {bankBFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs truncate"
                      style={{ color: "#475569" }}
                    >
                      {item.isFolder ? "📁 " : "📄 "}
                      {item.name}
                      {item.zipEntries && item.zipEntries.length > 0 && (
                        <ul className="ml-4 mt-1 max-h-16 overflow-auto border-l border-border pl-2">
                          {item.zipEntries.map((entry, i) => (
                            <li key={i} className="truncate" title={entry}>
                              📄 {entry}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-full bg-white border-b">
          <div className="container mx-auto px-6 py-2">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      )}

      {/* Instructions Section */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-b">
        <div className="container mx-auto px-6 py-6">
          <Alert
            className="border-2"
            style={{ borderColor: COLORS.primary, backgroundColor: "white" }}
          >
            <Info className="h-5 w-5" style={{ color: COLORS.primary }} />
            <AlertDescription>
              <div className="space-y-3">
                <h3
                  className="font-bold text-base"
                  style={{ color: COLORS.dark }}
                >
                  Getting Started with Schema Sync
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        1
                      </div>
                      <span
                        className="font-semibold"
                        style={{ color: COLORS.dark }}
                      >
                        Upload Master Schemas
                      </span>
                    </div>
                    <p style={{ color: "#64748B" }}>
                      Upload the <strong>master schema file</strong> for Bank A
                      and Bank B. These files should contain all field names,
                      data types, and sample values.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: COLORS.secondary }}
                      >
                        2
                      </div>
                      <span
                        className="font-semibold"
                        style={{ color: COLORS.dark }}
                      >
                        Upload Additional Files
                      </span>
                    </div>
                    <p style={{ color: "#64748B" }}>
                      Upload any additional data files, transaction records, or
                      supporting documents for each bank separately.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: "#10B981", color: "white" }}
                      >
                        3
                      </div>
                      <span
                        className="font-semibold"
                        style={{ color: COLORS.dark }}
                      >
                        AI Mapping & Merge
                      </span>
                    </div>
                    <p style={{ color: "#64748B" }}>
                      Click <strong>"Run AI Mapping"</strong> to automatically
                      match and merge schemas. Review suggestions and approve
                      mappings.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </>
  );
}
