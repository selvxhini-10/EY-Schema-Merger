import { useRef, useState } from "react";
import { fileToCsv } from "@/lib/file-to-csv";
import { listZipFiles } from "@/lib/list-zip-files";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadProgressBar } from "@/components/upload-progress-bar";

export function UploadContainerCard({
  onUploadProgress,
  onUploadVisible,
  children
}: {
  onUploadProgress?: (progress: number) => void
  onUploadVisible?: (visible: boolean) => void
  children?: React.ReactNode
}) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{
    name: string;
    isFolder: boolean;
    csv?: string;
    zipEntries?: string[];
  }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRemoveItem = (fileIdx: number) => {
    setUploadedFiles(items => items.filter((_, i) => i !== fileIdx))
  }

  const handleAddFilesClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    const items: {
      name: string;
      isFolder: boolean;
      csv?: string;
      zipEntries?: string[];
    }[] = [];
    for (const file of files) {
      const isFolder = !!(file.webkitRelativePath && file.webkitRelativePath.split("/").length > 2);
      let csv: string | undefined = undefined;
      let zipEntries: string[] | undefined = undefined;
      if (file.name.endsWith(".zip")) {
        try {
          zipEntries = await listZipFiles(file);
        } catch {}
      }
      try {
        csv = await fileToCsv(file);
      } catch {}
      items.push({
        name: isFolder ? file.webkitRelativePath.split("/")[1] : file.name,
        isFolder,
        csv,
        zipEntries,
      });
    }
    setUploadedFiles((prevItems) => [...prevItems, ...items]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      setVisible(true);
      setProgress(0);
      setUploadedFiles(items => [...items, ...files]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const structuredFiles = files.map((file) => ({
      name: file.name,
      isFolder: false,
      csv: undefined,
      zipEntries: undefined,
    }));
    setUploadedFiles((prevItems) => {
      return prevItems.concat(structuredFiles);
    });
  };

  return (
    <Card
      className={`w-full min-h-[300px] flex flex-col justify-center items-center mb-8 border-dashed border-2 ${isDragOver ? "border-primary bg-muted" : "border-border bg-card"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle className="w-full flex justify-center items-center text-center whitespace-nowrap overflow-hidden text-ellipsis">Upload Files</CardTitle>
      </CardHeader>
      <CardContent className="w-full flex flex-col items-center">
        <UploadProgressBar progress={progress} visible={visible} />
        <div className="text-muted-foreground text-center py-8">
          Drag and drop files here to upload
        </div>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
          onClick={handleUploadClick}
        >
          Select Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          multiple
          onChange={handleFileInputChange}
          accept=".zip,application/zip,application/x-zip-compressed,.json,.csv,.txt"
          {...({ webkitdirectory: "true" } as any)}
          onClick={(e) => {
            (e.target as HTMLInputElement).value = "";
          }}
        />
        {uploadedFiles.length > 0 && (
          <div className="w-full max-w-xs mt-4">
            <div className="font-semibold text-xs mb-1">Uploaded Items:</div>
            <div className="w-full max-h-32 overflow-auto border rounded bg-background">
              <ul className="w-full flex flex-col gap-1 p-2">
                {uploadedFiles.map((item, idx) => (
                  <li
                    key={idx}
                    className="bg-muted rounded px-2 py-1 text-xs max-w-full truncate"
                    title={item.name}
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
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
