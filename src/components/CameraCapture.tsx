import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface Props {
  onCapture: (photo: Blob) => void;
}

export function CameraCapture({ onCapture }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Couldn't access the camera. Check your browser permissions."));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
        setOpen(false);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="flex items-center gap-1.5 rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-black hover:text-black"
      >
        <Camera size={15} strokeWidth={2} />
        Use camera
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-black">Camera</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close camera">
                <X size={18} />
              </button>
            </div>

            {error ? (
              <p className="py-8 text-center text-sm text-red-600">{error}</p>
            ) : (
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl bg-black" />
            )}

            {!error && (
              <button
                type="button"
                onClick={handleCapture}
                className="mt-3 w-full rounded-full bg-black px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Capture
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
