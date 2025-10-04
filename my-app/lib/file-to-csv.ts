// Utility to convert File/Blob to CSV string (simple JSON array to CSV)
export async function fileToCsv(file: File): Promise<string> {
  // Try to parse as JSON, then convert to CSV. If not JSON, just return as text.
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object') {
      const keys = Object.keys(json[0]);
      const csvRows = [keys.join(",")];
      for (const row of json) {
        csvRows.push(keys.map(k => JSON.stringify(row[k] ?? "")).join(","));
      }
      return csvRows.join("\n");
    }
  } catch (e) {
    // Not JSON, return as is
  }
  return text;
}
