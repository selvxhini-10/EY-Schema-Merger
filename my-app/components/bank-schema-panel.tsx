"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

type BankSchemaPanelProps = {
  bankName: string;
  color: string;
};

type BankTable = {
  tableName: string;
  fields: Array<{
    label: string;
    description: string;
  }>;
};

type BankSchemaData = {
  bank: string;
  tables: Record<string, BankTable["fields"]>;
};

export function BankSchemaPanel({ bankName, color }: BankSchemaPanelProps) {
  const [schemaData, setSchemaData] = useState<BankSchemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchemaData = async () => {
      try {
        const response = await fetch("/api/schemas");
        if (!response.ok) {
          throw new Error("Failed to fetch schema data");
        }
        const data = await response.json();

        // Get the appropriate bank schema based on bankName
        const bankSchema =
          bankName === "Bank A" ? data.bank1Schema : data.bank2Schema;
        setSchemaData(bankSchema);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSchemaData();
  }, [bankName]);

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          border: "border-blue-200",
          bg: "bg-blue-50",
          text: "text-blue-800",
          accent: "border-l-blue-500",
        };
      case "purple":
        return {
          border: "border-purple-200",
          bg: "bg-purple-50",
          text: "text-purple-800",
          accent: "border-l-purple-500",
        };
      default:
        return {
          border: "border-gray-200",
          bg: "bg-gray-50",
          text: "text-gray-800",
          accent: "border-l-gray-500",
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3
            className={`text-lg font-semibold ${getColorClasses(color).text}`}
          >
            {bankName} Schema
          </h3>
        </div>
        <Card className={`border-l-4 ${getColorClasses(color).accent}`}>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-muted-foreground">
                Loading schema data...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3
            className={`text-lg font-semibold ${getColorClasses(color).text}`}
          >
            {bankName} Schema
          </h3>
        </div>
        <Card className={`border-l-4 ${getColorClasses(color).accent}`}>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-destructive">Error: {error}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!schemaData) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3
            className={`text-lg font-semibold ${getColorClasses(color).text}`}
          >
            {bankName} Schema
          </h3>
        </div>
        <Card className={`border-l-4 ${getColorClasses(color).accent}`}>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-muted-foreground">
                No schema data available
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tables = Object.entries(schemaData.tables);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className={`text-lg font-semibold ${getColorClasses(color).text}`}>
          {bankName} Schema
        </h3>
        <div className="text-sm text-muted-foreground">
          {tables.length} tables
        </div>
      </div>
      {tables.map(([tableName, fields]) => (
        <Card
          key={tableName}
          className={`border-l-4 ${getColorClasses(color).accent}`}
        >
          <CardHeader className="pb-3">
            <CardTitle
              className={`text-base font-semibold ${
                getColorClasses(color).text
              }`}
            >
              {tableName}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {fields.length} fields
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-1">
              {fields.map((field, index) => (
                <div key={index} className="bg-muted rounded px-2 py-1">
                  <span className="font-mono text-xs truncate block">
                    {field.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
