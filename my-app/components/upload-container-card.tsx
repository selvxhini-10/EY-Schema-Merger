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


  // Upload file to backend /upload endpoint
  const uploadFile = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    // Ensure bank param is a or b for backend
    let bankParam = bank.toLowerCase();
    if (bankParam === "a" || bankParam === "b") {
      formData.append("bank", bankParam);
    } else if (bankParam === "banka") {
      formData.append("bank", "a");
    } else if (bankParam === "bankb") {
      formData.append("bank", "b");
    } else {
      formData.append("bank", bank);
    }
    setVisible(true);
    setProgress(0);
    try {
      await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = progressEvent.total ? Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0;
          setProgress(percent);
          onUploadProgress?.(percent);
        },
      });
      setProgress(100);
      onUploadProgress?.(100);
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
        onUploadVisible?.(false);
      }, 2000);
    }
  };

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



  // Removed unused handleMasterSchemaUpload (use drag/drop or file input instead)

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
