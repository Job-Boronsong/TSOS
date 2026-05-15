import { useRef, useState } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onClear?: () => void;
  label?: string;
}

export function LogoUpload({
  currentUrl,
  onUploaded,
  onClear,
  label = "Upload Logo",
}: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      const url = `/api/storage${res.objectPath}`;
      onUploaded(url);
    },
    onError: (err) => {
      console.error("Logo upload failed:", err);
    },
  });

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    await uploadFile(file);
  }

  const displayUrl = preview || currentUrl;

  return (
    <div className="flex items-center gap-3">
      {displayUrl ? (
        <div className="relative">
          <img
            src={displayUrl}
            alt="Logo preview"
            className="h-14 w-14 rounded-md object-contain border bg-white p-1"
          />
          {onClear && !isUploading && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onClear();
              }}
              className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="h-14 w-14 rounded-md border border-dashed flex items-center justify-center bg-muted">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {label}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">PNG, JPG or SVG (max 2 MB)</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
