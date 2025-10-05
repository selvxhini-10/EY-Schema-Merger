import { useRef, useState } from "react";
import axios, { AxiosProgressEvent } from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadProgressBar } from "@/components/upload-progress-bar";

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

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bank", bank);

    try {
      setVisible(true);
      setProgress(0);

  await axios.post("http://localhost:8000/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

 console.log("Upload success:", formData);
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
          Drag and drop your file here or click below
        </div>

        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded"
          onClick={() => fileInputRef.current?.click()}
        >
          Select File
        </button>

        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
          accept=".csv, .xlsx, .xls"
        />

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
