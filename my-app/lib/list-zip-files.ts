import JSZip from "jszip";

// Returns a flat list of all files (with paths) in a zip file
export async function listZipFiles(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const fileNames: string[] = [];
  zip.forEach((relativePath, file) => {
    if (!file.dir) fileNames.push(relativePath);
  });
  return fileNames;
}
