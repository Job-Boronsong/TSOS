import { useRef, useState } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Camera, X, Loader2, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PassportPhotoUploadProps {
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onClear?: () => void;
}

export function PassportPhotoUpload({ currentUrl, onUploaded, onClear }: PassportPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      setUploadError(null);
      const url = `/api/storage${res.objectPath}`;
      onUploaded(url);
    },
    onError: (err) => {
      console.error("Photo upload failed:", err);
      // Revert the optimistic preview so the user knows the upload didn't work.
      setPreview(null);
      // Show the real error message (includes HTTP status from use-upload).
      setUploadError(err.message || "Upload failed — please try again.");
    },
  });

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset error from any previous attempt.
    setUploadError(null);
    // Show local preview optimistically while the upload runs.
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    await uploadFile(file);
    // Reset the input so the same file can be selected again if needed.
    e.target.value = "";
  }

  const displayUrl = preview || currentUrl;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-24 h-28 rounded-lg border-2 border-dashed border-input bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/60 transition-colors"
        onClick={() => !isUploading && inputRef.current?.click()}
        title="Click to upload passport photo"
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt="Passport photo"
              className="w-full h-full object-cover"
              onError={() => {
                // The stored URL is broken (e.g. file missing from storage).
                // Clear the preview so we fall back to the placeholder icon.
                setPreview(null);
              }}
            />
            {onClear && !isUploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPreview(null); setUploadError(null); onClear(); }}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center shadow"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <User className="w-8 h-8 opacity-40" />
            <span className="text-[10px]">Photo</span>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-24 text-xs gap-1"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="h-3 w-3" />
        {isUploading ? "Uploading…" : displayUrl ? "Change" : "Upload"}
      </Button>

      {uploadError && (
        <p className="text-[10px] text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {uploadError}
        </p>
      )}

      {!uploadError && (
        <p className="text-[10px] text-muted-foreground text-center leading-tight">
          Passport size<br />JPG or PNG
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
