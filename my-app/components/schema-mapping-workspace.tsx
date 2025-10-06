"use client";

import { useState } from "react";
import { read, utils } from "xlsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankSchemaPanel } from "@/components/bank-schema-panel";
import { UnifiedSchemaPanel } from "@/components/unified-schema-panel";
import { MappingSummary } from "@/components/mapping-summary";
import { TopBar } from "@/components/top-bar";

export type SchemaField = {
  id: string;
  name: string;
  type: string;
  sampleValue: string;
};

export type Mapping = {
  id: string;
  sourceField: string;
  targetField: string;
  confidence: "high" | "medium" | "low";
  approved: boolean;
};

// Mock data for demonstration
const mockBankASchema: SchemaField[] = [
  { id: "a1", name: "customer_id", type: "string", sampleValue: "CUST-001" },
  { id: "a2", name: "full_name", type: "string", sampleValue: "John Smith" },
  { id: "a3", name: "birth_date", type: "date", sampleValue: "1985-03-15" },
  { id: "a4", name: "acct_type", type: "string", sampleValue: "CHECKING" },
  { id: "a5", name: "balance_amt", type: "number", sampleValue: "15000.00" },
  { id: "a6", name: "branch_code", type: "string", sampleValue: "BR-NYC-01" },
];

const mockBankBSchema: SchemaField[] = [
  { id: "b1", name: "ClientID", type: "string", sampleValue: "CLI-2001" },
  { id: "b2", name: "FirstName", type: "string", sampleValue: "Jane" },
  { id: "b3", name: "LastName", type: "string", sampleValue: "Doe" },
  { id: "b4", name: "DOB", type: "date", sampleValue: "03/22/1990" },
  { id: "b5", name: "AccountType", type: "string", sampleValue: "Savings" },
  { id: "b6", name: "CurrentBalance", type: "number", sampleValue: "25000" },
  { id: "b7", name: "Region", type: "string", sampleValue: "Northeast" },
];

const mockUnifiedSchema: SchemaField[] = [
  { id: "u1", name: "CustomerID", type: "string", sampleValue: "" },
  { id: "u2", name: "FirstName", type: "string", sampleValue: "" },
  { id: "u3", name: "LastName", type: "string", sampleValue: "" },
  { id: "u4", name: "DateOfBirth", type: "date", sampleValue: "" },
  { id: "u5", name: "AccountType", type: "string", sampleValue: "" },
  { id: "u6", name: "Balance", type: "number", sampleValue: "" },
  { id: "u7", name: "Location", type: "string", sampleValue: "" },
];

const mockMappings: Mapping[] = [
  {
    id: "m1",
    sourceField: "customer_id",
    targetField: "CustomerID",
    confidence: "high",
    approved: false,
  },
  {
    id: "m2",
    sourceField: "ClientID",
    targetField: "CustomerID",
    confidence: "high",
    approved: false,
  },
  {
    id: "m3",
    sourceField: "full_name",
    targetField: "FirstName",
    confidence: "medium",
    approved: false,
  },
  {
    id: "m4",
    sourceField: "FirstName",
    targetField: "FirstName",
    confidence: "high",
    approved: false,
  },
  {
    id: "m5",
    sourceField: "LastName",
    targetField: "LastName",
    confidence: "high",
    approved: false,
  },
  {
    id: "m6",
    sourceField: "birth_date",
    targetField: "DateOfBirth",
    confidence: "high",
    approved: false,
  },
  {
    id: "m7",
    sourceField: "DOB",
    targetField: "DateOfBirth",
    confidence: "high",
    approved: false,
  },
  {
    id: "m8",
    sourceField: "acct_type",
    targetField: "AccountType",
    confidence: "medium",
    approved: false,
  },
  {
    id: "m9",
    sourceField: "AccountType",
    targetField: "AccountType",
    confidence: "high",
    approved: false,
  },
  {
    id: "m10",
    sourceField: "balance_amt",
    targetField: "Balance",
    confidence: "high",
    approved: false,
  },
  {
    id: "m11",
    sourceField: "CurrentBalance",
    targetField: "Balance",
    confidence: "high",
    approved: false,
  },
  {
    id: "m12",
    sourceField: "branch_code",
    targetField: "Location",
    confidence: "low",
    approved: false,
  },
  {
    id: "m13",
    sourceField: "Region",
    targetField: "Location",
    confidence: "medium",
    approved: false,
  },
];

interface SchemaMappingWorkspaceProps {
  bankASchema: SchemaField[];
  bankBSchema: SchemaField[];
}

export function SchemaMappingWorkspace({ bankASchema, bankBSchema }: SchemaMappingWorkspaceProps) {
  const [unifiedSchema] = useState<SchemaField[]>(mockUnifiedSchema);
  const [mappings, setMappings] = useState<Mapping[]>(mockMappings);
  // Approval state for Confirmed Unified Tables
  const [tableApproval, setTableApproval] = useState<Record<string, "none" | "approved" | "rejected">>({});

  const handleApproveMapping = (mappingId: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.id === mappingId ? { ...m, approved: !m.approved } : m
      )
    );
  } 

  // For MappingSummary: count approved tables from tableApproval
  const confirmedTableNames = [
    "CustomerID",
    "FirstName",
    "LastName",
    "DateOfBirth",
    "AccountType",
    "Balance",
    "Location"
  ];
  const totalTables = confirmedTableNames.length;
  const approvedTables = confirmedTableNames.filter((name) => tableApproval[name] === "approved").length;
  const tableCompletion = totalTables > 0 ? (approvedTables / totalTables) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Schema Mapping Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <BankSchemaPanel bankName="Bank A" color="blue" />
              </div>
              <div>
                <UnifiedSchemaPanel
                  fields={unifiedSchema}
                  mappings={mappings}
                  onApproveMapping={handleApproveMapping}
                  tableApproval={tableApproval}
                  setTableApproval={setTableApproval}
                />
              </div>
              <div>
                <BankSchemaPanel bankName="Bank B" color="purple" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <MappingSummary mappings={mappings} tableCompletion={tableCompletion} approvedTables={approvedTables} totalTables={totalTables} />
      </div>
    </div>
  );
}
