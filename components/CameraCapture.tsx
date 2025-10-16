"use client";

import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (base64: string, file: File) => void;
  onCancel: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted) {
          // if component unmounted, immediately stop tracks
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata / play so dimensions are available
          const onLoaded = () => {
            setCameraReady(true);
            videoRef.current?.removeEventListener("loadedmetadata", onLoaded);
          };
          videoRef.current.addEventListener("loadedmetadata", onLoaded);

          // Attempt to play (muted allowed to autoplay)
          try {
            // Some browsers require play() call to actually start
            await videoRef.current.play();
          } catch (playErr) {
            // Not fatal: metadata listener will still fire
            console.warn("video.play() blocked or failed:", playErr);
          }
        } else {
          setCameraReady(true);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please check permissions and HTTPS.");
      }
    }

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    try {
      // Pause and remove video src first
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch (e) { /* ignore */ }
        try { videoRef.current.srcObject = null; } catch (e) { /* ignore */ }
        // in some browsers clearing srcObject then clearing src avoids lingering locks
        try { (videoRef.current as HTMLVideoElement).src = ""; } catch (e) { /* ignore */ }
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try { track.stop(); } catch (e) { /* ignore */ }
        });
        streamRef.current = null;
      }
    } finally {
      setCameraReady(false);
      setIsCapturing(false);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const handleCapture = async () => {
    if (!videoRef.current || !streamRef.current) return;
    if (isCapturing) return;

    setIsCapturing(true);
    try {
      // Wait briefly until the video has non-zero dimensions
      let attempts = 0;
      let w = videoRef.current.videoWidth;
      let h = videoRef.current.videoHeight;
      while ((w === 0 || h === 0) && attempts < 10) {
        await sleep(100);
        w = videoRef.current.videoWidth;
        h = videoRef.current.videoHeight;
        attempts++;
      }

      // Fallback dimensions if still zero
      if (w === 0 || h === 0) {
        w = 640;
        h = 480;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Get base64 and blob -> file
      const base64 = canvas.toDataURL("image/jpeg", 0.9);
      const blob = await (await fetch(base64)).blob();
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });

      // Stop camera as soon as we have the capture
      stopCamera();

      onCapture(base64, file);
    } catch (err) {
      console.error("Capture failed:", err);
      setError("Capture failed. See console for details.");
      // Ensure we still stop camera to avoid lingering lock
      stopCamera();
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-64 h-64 object-cover rounded-md border bg-black"
        />
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!cameraReady || isCapturing}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isCapturing ? "Capturing..." : "Capture"}
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
