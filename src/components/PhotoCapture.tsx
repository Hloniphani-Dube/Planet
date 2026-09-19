import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { X } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

interface Props {
  photos: Blob[];
  onChange: (photos: Blob[]) => void;
  maxPhotos?: number;
}

export function PhotoCapture({ photos, onChange, maxPhotos = 4 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  function addFiles(files: File[]) {
    const room = maxPhotos - photos.length;
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length > 0 && room > 0) {
      onChange([...photos, ...images.slice(0, room)]);
    }
  }

  function addPhoto(photo: Blob) {
    if (photos.length >= maxPhotos) return;
    onChange([...photos, photo]);
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  const canAddMore = photos.length < maxPhotos;

  return (
    <div
      className="flex w-full max-w-md flex-col items-center gap-4"
      onDragEnter={canAddMore ? handleDragEnter : undefined}
      onDragOver={canAddMore ? handleDragOver : undefined}
      onDragLeave={canAddMore ? handleDragLeave : undefined}
      onDrop={canAddMore ? handleDrop : undefined}
    >
      {photos.length > 0 ? (
        <div
          className={`grid w-full grid-cols-4 gap-2 rounded-2xl p-1 transition-colors ${
            isDragging ? "bg-neutral-100 ring-2 ring-black ring-offset-2" : ""
          }`}
        >
          {photos.map((photo, i) => (
            <PhotoThumb key={i} photo={photo} onRemove={() => removePhoto(i)} />
          ))}
          {canAddMore && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 text-xs text-neutral-400 transition-colors hover:border-black hover:text-black"
            >
              Add
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex h-48 w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed text-sm transition-colors ${
            isDragging
              ? "border-black bg-neutral-100 text-black"
              : "border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-neutral-400"
          }`}
        >
          <span>{isDragging ? "Drop to add" : "No photos yet"}</span>
          <span className="text-xs text-neutral-400">Drag and drop, or click to choose</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {canAddMore && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            {photos.length === 0 ? "Upload photo" : "Add another angle"}
          </button>
          <CameraCapture onCapture={addPhoto} />
        </div>
      )}

      {photos.length > 0 && canAddMore && (
        <p className="text-center text-xs text-neutral-400">
          Add up to {maxPhotos} photos (leaf top, underside, stem, soil) for a more precise
          diagnosis.
        </p>
      )}
    </div>
  );
}

function PhotoThumb({ photo, onRemove }: { photo: Blob; onRemove: () => void }) {
  // Created and revoked inside one effect. Creating it during render and revoking in a
  // cleanup breaks under StrictMode, which runs the cleanup and then reuses the dead URL.
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const objectUrl = URL.createObjectURL(photo);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
}
