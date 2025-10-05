import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { UploadProgressBar } from "@/components/upload-progress-bar";
// Removed duplicate import of axios

export function UploadContainerCard({
  bank,
  onUploadProgress,
  onUploadVisible,
  children
}: {
  bank: string;
  onUploadProgress?: (progress: number) => void;
  onUploadVisible?: (visible: boolean) => void;
  children?: React.ReactNode;
}) {
const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFile(file);
      uploadFile(file);
    }
  };


  // New: Master schema upload handler
  const handleMasterSchemaUpload = async (bank: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      const file = input.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bank", bank);
      try {
        setVisible(true);
        setProgress(0);
        const response = await axios.post(
          "http://localhost:8000/schemas/schemas/parse",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        console.log("Master schema uploaded:", response.data);
        alert(`File "${file.name}" uploaded successfully!`);
      } catch (error: any) {
        console.error("Upload failed:", error);
        let message = "Upload failed.";
        if (error.response) {
          message += ` Server responded with status ${error.response.status}: ${error.response.data}`;
        } else if (error.request) {
          message += " No response received from server.";
        } else if (error.message) {
          message += ` ${error.message}`;
        }
        alert(message);
      } finally {
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 2000);
      }
    };
    input.click();
  };

  return (
    <Card
      className={`w-full min-h-[300px] flex flex-col justify-center items-center mb-8 border-dashed border-2 ${
        isDragOver ? "border-primary bg-muted" : "border-border bg-card"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={handleDrop}
    >
      <CardHeader>
        <CardTitle className="text-center">Upload File</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center">
        <UploadProgressBar progress={progress} visible={visible} />

        <div className="text-muted-foreground text-center py-8">
          Drag and drop your file here or use the buttons below to upload master schemas.
        </div>



        {uploadedFile && (
          <div className="mt-4 text-sm text-center">
            <div className="font-semibold">Selected file:</div>
            <div>{uploadedFile.name}</div>
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  );
}
