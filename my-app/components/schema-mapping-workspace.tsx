"use client"

import { useState } from "react"
import { read, utils } from "xlsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SchemaPanel } from "@/components/schema-panel"

// Table info for Bank A and Bank B (from backend folder structure)
const bankATables = [
  "Bank1_Mock_CurSav_Accounts",
  "Bank1_Mock_CurSav_Transactions",
  "Bank1_Mock_Customer",
  "Bank1_Mock_FixedTerm_Accounts",
  "Bank1_Mock_FixedTerm_Transactions",
  "Bank1_Mock_Loan_Accounts",
  "Bank1_Mock_Loan_Transactions",
];

const bankBTables = [
  "Bank2_Mock_Addresses",
  "Bank2_Mock_Customer",
  "Bank2_Mock_Deposit_Accounts",
  "Bank2_Mock_Deposit_Transactions",
  "Bank2_Mock_Identifications",
  "Bank2_Mock_Loan_Accounts",
  "Bank2_Mock_Loan_Transactions",
];
import { UnifiedSchemaPanel } from "@/components/unified-schema-panel"
import { MappingSummary } from "@/components/mapping-summary"
import { TopBar } from "@/components/top-bar"

export type SchemaField = {
  id: string
  name: string
  type: string
  sampleValue: string
}

export type Mapping = {
  id: string
  sourceField: string
  targetField: string
  confidence: "high" | "medium" | "low"
  approved: boolean
}

// Mock data for demonstration
const mockBankASchema: SchemaField[] = [
  { id: "a1", name: "customer_id", type: "string", sampleValue: "CUST-001" },
  { id: "a2", name: "full_name", type: "string", sampleValue: "John Smith" },
  { id: "a3", name: "birth_date", type: "date", sampleValue: "1985-03-15" },
  { id: "a4", name: "acct_type", type: "string", sampleValue: "CHECKING" },
  { id: "a5", name: "balance_amt", type: "number", sampleValue: "15000.00" },
  { id: "a6", name: "branch_code", type: "string", sampleValue: "BR-NYC-01" },
]

const mockBankBSchema: SchemaField[] = [
  { id: "b1", name: "ClientID", type: "string", sampleValue: "CLI-2001" },
  { id: "b2", name: "FirstName", type: "string", sampleValue: "Jane" },
  { id: "b3", name: "LastName", type: "string", sampleValue: "Doe" },
  { id: "b4", name: "DOB", type: "date", sampleValue: "03/22/1990" },
  { id: "b5", name: "AccountType", type: "string", sampleValue: "Savings" },
  { id: "b6", name: "CurrentBalance", type: "number", sampleValue: "25000" },
  { id: "b7", name: "Region", type: "string", sampleValue: "Northeast" },
]

const mockUnifiedSchema: SchemaField[] = [
  { id: "u1", name: "CustomerID", type: "string", sampleValue: "" },
  { id: "u2", name: "FirstName", type: "string", sampleValue: "" },
  { id: "u3", name: "LastName", type: "string", sampleValue: "" },
  { id: "u4", name: "DateOfBirth", type: "date", sampleValue: "" },
  { id: "u5", name: "AccountType", type: "string", sampleValue: "" },
  { id: "u6", name: "Balance", type: "number", sampleValue: "" },
  { id: "u7", name: "Location", type: "string", sampleValue: "" },
]

const mockMappings: Mapping[] = [
  { id: "m1", sourceField: "customer_id", targetField: "CustomerID", confidence: "high", approved: false },
  { id: "m2", sourceField: "ClientID", targetField: "CustomerID", confidence: "high", approved: false },
  { id: "m3", sourceField: "full_name", targetField: "FirstName", confidence: "medium", approved: false },
  { id: "m4", sourceField: "FirstName", targetField: "FirstName", confidence: "high", approved: false },
  { id: "m5", sourceField: "LastName", targetField: "LastName", confidence: "high", approved: false },
  { id: "m6", sourceField: "birth_date", targetField: "DateOfBirth", confidence: "high", approved: false },
  { id: "m7", sourceField: "DOB", targetField: "DateOfBirth", confidence: "high", approved: false },
  { id: "m8", sourceField: "acct_type", targetField: "AccountType", confidence: "medium", approved: false },
  { id: "m9", sourceField: "AccountType", targetField: "AccountType", confidence: "high", approved: false },
  { id: "m10", sourceField: "balance_amt", targetField: "Balance", confidence: "high", approved: false },
  { id: "m11", sourceField: "CurrentBalance", targetField: "Balance", confidence: "high", approved: false },
  { id: "m12", sourceField: "branch_code", targetField: "Location", confidence: "low", approved: false },
  { id: "m13", sourceField: "Region", targetField: "Location", confidence: "medium", approved: false },
]

export function SchemaMappingWorkspace() {
  const [bankASchema, setBankASchema] = useState<SchemaField[]>([])
  const [bankBSchema, setBankBSchema] = useState<SchemaField[]>([])
  const [unifiedSchema] = useState<SchemaField[]>(mockUnifiedSchema)
  const [mappings, setMappings] = useState<Mapping[]>(mockMappings)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setSchema: React.Dispatch<React.SetStateAction<SchemaField[]>>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer)
      const workbook = read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = utils.sheet_to_json(sheet, { header: 1 })

      const schemaFields: SchemaField[] = jsonData.slice(1).map((row: any, index: number) => ({
        id: `field-${index}`,
        name: row[0] || `Column-${index}`,
        type: typeof row[1],
        sampleValue: row[1]?.toString() || "",
      }))

      setSchema(schemaFields)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleApproveMapping = (mappingId: string) => {
    setMappings((prev) => prev.map((m) => (m.id === mappingId ? { ...m, approved: !m.approved } : m)))
  }

  // Add console logs to debug state updates
  console.log("Bank A Schema State:", bankASchema);
  console.log("Bank B Schema State:", bankBSchema);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Schema Mapping Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <TopBar setBankASchema={setBankASchema} setBankBSchema={setBankBSchema} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="mb-2">
                  <span className="font-semibold text-blue-700">Bank A Tables:</span>
                  <div className="space-y-2 mt-1">
                    {bankATables.map((t) => (
                      <Card key={t} className="border-l-4 border-l-chart-4 hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center">
                          <span className="font-mono text-xs text-card-foreground truncate">{t}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
              <UnifiedSchemaPanel fields={unifiedSchema} mappings={mappings} onApproveMapping={handleApproveMapping} />
              <div>
                <div className="mb-2">
                  <span className="font-semibold text-purple-700">Bank B Tables</span>
                  <div className="space-y-2 mt-1">
                    {bankBTables.map((t) => (
                      <Card key={t} className="border-l-4 border-l-chart-1 hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center">
                          <span className="font-mono text-xs text-card-foreground truncate">{t}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <SchemaPanel title="Bank B Schema" fields={bankBSchema} color="purple" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <MappingSummary mappings={mappings} />
      </div>
    </div>
  )
}
