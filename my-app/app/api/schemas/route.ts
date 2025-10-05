import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const schemasDir = path.join(process.cwd(), '..', 'backend', 'schemas');
    
    // Read the schema files
    const bank1Schema = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'bank1__bank1_schema.json'), 'utf8')
    );
    
    const bank2Schema = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'bank2__bank2_schema.json'), 'utf8')
    );
    
    const tableMappings = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'table_name_mapping.json'), 'utf8')
    );
    
    const columnMappings = JSON.parse(
      fs.readFileSync(path.join(schemasDir, 'bank_column_mapping.json'), 'utf8')
    );

    // Process the data to create unified schema structure
    const unifiedTables = tableMappings.map((tableMapping: any) => {
      const tableName = tableMapping.best_match_bank1_table;
      const status = tableMapping.status;
      
      // Get fields from both banks for this table
      const bank1Fields = bank1Schema.tables[tableName] || [];
      const bank2Fields = bank2Schema.tables[tableMapping.bank2_table] || [];
      
      // Get column mappings for this table
      const tableColumnMappings = columnMappings[tableName] || [];
      
      // For confirmed matches, show only Bank 1 fields that have confident mappings
      let fieldsToShow = [];
      if (status === "Confident Match") {
        // Get Bank 1 fields that have confident mappings (don't need review)
        const confidentMappings = tableColumnMappings.filter(mapping => 
          mapping.status === "Confident Match"
        );
        const confidentBank1Fields = confidentMappings.map(mapping => 
          bank1Fields.find(field => field.label === mapping.best_match_bank1_column?.label)
        ).filter(Boolean);
        
        fieldsToShow = confidentBank1Fields;
      } else {
        // For tables that need review, show all unique fields
        const allFields = [...bank1Fields, ...bank2Fields];
        fieldsToShow = allFields.filter((field, index, self) => 
          index === self.findIndex(f => f.label === field.label)
        );
      }
      
      return {
        tableName,
        status,
        fields: fieldsToShow.map((field, index) => ({
          id: `field-${index}`,
          name: field.label,
          type: inferFieldType(field.label, field.description),
          description: field.description,
        })),
        columnMappings: tableColumnMappings.map((mapping: any, index: number) => ({
          id: `cm-${tableName}-${index}`,
          bankAColumn: mapping.best_match_bank1_column?.label || '',
          bankBColumn: mapping.bank2_column?.label || '',
          unifiedColumn: mapping.best_match_bank1_column?.label || mapping.bank2_column?.label || '',
          confidence: getConfidenceLevel(mapping.confidence_rating),
          status: mapping.status,
          approved: mapping.status === 'Confident Match',
        })),
      };
    });

    return NextResponse.json({
      tables: unifiedTables,
      bank1Schema,
      bank2Schema,
    });
  } catch (error) {
    console.error('Error reading schema files:', error);
    return NextResponse.json(
      { error: 'Failed to read schema files' },
      { status: 500 }
    );
  }
}

function inferFieldType(fieldName: string, description: string): string {
  const name = fieldName.toLowerCase();
  const desc = description.toLowerCase();
  
  if (name.includes('date') || name.includes('time') || desc.includes('date')) {
    return 'date';
  }
  if (name.includes('amount') || name.includes('balance') || name.includes('rate') || 
      name.includes('number') || desc.includes('amount') || desc.includes('balance')) {
    return 'number';
  }
  if (name.includes('id') || name.includes('key') || name.includes('reference')) {
    return 'string';
  }
  return 'string';
}

function getConfidenceLevel(rating: number): 'high' | 'medium' | 'low' {
  if (rating >= 80) return 'high';
  if (rating >= 60) return 'medium';
  return 'low';
}
