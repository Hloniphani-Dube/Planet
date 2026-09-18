import { useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { CameraCapture } from "./CameraCapture";

interface Props {
  photos: Blob[];
  onChange: (photos: Blob[]) => void;
  maxPhotos?: number;
}

export function PhotoCapture({ photos, onChange, maxPhotos = 4 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addPhoto(photo: Blob) {
    if (photos.length >= maxPhotos) return;
    onChange([...photos, photo]);
  }

  function removePhoto(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const room = maxPhotos - photos.length;
    if (files.length > 0 && room > 0) {
      onChange([...photos, ...files.slice(0, room)]);
    }
    event.target.value = "";
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      {photos.length > 0 ? (
        <div className="grid w-full grid-cols-4 gap-2">
          {photos.map((photo, i) => (
            <PhotoThumb key={i} photo={photo} onRemove={() => removePhoto(i)} />
          ))}
        </div>
      ) : (
        <div className="flex h-48 w-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-500">
          No photos yet
        </div>
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

      {photos.length < maxPhotos && (
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

      {photos.length > 0 && photos.length < maxPhotos && (
        <p className="text-center text-xs text-neutral-400">
          Add up to {maxPhotos} photos (leaf top, underside, stem, soil) for a more precise
          diagnosis.
        </p>
      )}
    </div>
  );
}

function PhotoThumb({ photo, onRemove }: { photo: Blob; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(photo), [photo]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200">
      <img src={url} alt="" className="h-full w-full object-cover" />
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
