"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, AlertCircle } from "lucide-react"

type MergedRecord = {
  id: string
  CustomerID: string
  FirstName: string
  LastName: string
  DateOfBirth: string
  AccountType: string
  Balance: string
  Location: string
  Institution: string
  hasConflict: boolean
}

const mockMergedData: MergedRecord[] = [
  {
    id: "1",
    CustomerID: "CUST-001",
    FirstName: "John",
    LastName: "Smith",
    DateOfBirth: "1985-03-15",
    AccountType: "Checking",
    Balance: "$15,000.00",
    Location: "New York",
    Institution: "Bank A",
    hasConflict: false,
  },
  {
    id: "2",
    CustomerID: "CLI-2001",
    FirstName: "Jane",
    LastName: "Doe",
    DateOfBirth: "1990-03-22",
    AccountType: "Savings",
    Balance: "$25,000.00",
    Location: "Northeast",
    Institution: "Bank B",
    hasConflict: false,
  },
  {
    id: "3",
    CustomerID: "CUST-002",
    FirstName: "Michael",
    LastName: "Johnson",
    DateOfBirth: "1978-11-08",
    AccountType: "Checking",
    Balance: "$8,500.00",
    Location: "Boston",
    Institution: "Bank A",
    hasConflict: true,
  },
  {
    id: "4",
    CustomerID: "CLI-2002",
    FirstName: "Sarah",
    LastName: "Williams",
    DateOfBirth: "1992-07-14",
    AccountType: "Investment",
    Balance: "$45,000.00",
    Location: "Northeast",
    Institution: "Bank B",
    hasConflict: false,
  },
  {
    id: "5",
    CustomerID: "CUST-003",
    FirstName: "David",
    LastName: "Brown",
    DateOfBirth: "1988-05-20",
    AccountType: "Savings",
    Balance: "$12,300.00",
    Location: "New York",
    Institution: "Bank A",
    hasConflict: false,
  },
]

export function MergedDataPreview() {
  const [searchQuery, setSearchQuery] = useState("")
  const [institutionFilter, setInstitutionFilter] = useState("all")
  const [accountTypeFilter, setAccountTypeFilter] = useState("all")

  const filteredData = mockMergedData.filter((record) => {
    const matchesSearch =
      searchQuery === "" ||
      Object.values(record).some((value) => value.toString().toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesInstitution = institutionFilter === "all" || record.Institution === institutionFilter
    const matchesAccountType = accountTypeFilter === "all" || record.AccountType === accountTypeFilter

    return matchesSearch && matchesInstitution && matchesAccountType
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merged Data Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Institution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Institutions</SelectItem>
              <SelectItem value="Bank A">Bank A</SelectItem>
              <SelectItem value="Bank B">Bank B</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Account Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Checking">Checking</SelectItem>
              <SelectItem value="Savings">Savings</SelectItem>
              <SelectItem value="Investment">Investment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Institution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((record) => (
                <TableRow key={record.id} className={record.hasConflict ? "bg-destructive/10" : ""}>
                  <TableCell className="font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {record.CustomerID}
                      {record.hasConflict && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </div>
                  </TableCell>
                  <TableCell>{record.FirstName}</TableCell>
                  <TableCell>{record.LastName}</TableCell>
                  <TableCell>{record.DateOfBirth}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{record.AccountType}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{record.Balance}</TableCell>
                  <TableCell>{record.Location}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.Institution}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredData.length} of {mockMergedData.length} records
        </div>
      </CardContent>
    </Card>
  )
}
