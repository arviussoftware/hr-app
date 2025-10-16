"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImg } from "./cropUtils";
import { Button } from "@/components/ui/button";

interface UploadPhotoProps {
  userId: number;
  onUploadSuccess?: (newUrl: string) => void;
}

export default function UploadPhoto({ userId, onUploadSuccess }: UploadPhotoProps) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const MAX_FILE_SIZE = 500 * 1024; // 500 KB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const selectedFile = e.target.files[0];

    if (selectedFile.size > MAX_FILE_SIZE) {
      alert("File size exceeds 500 KB.");
      setFile(null);
      setImageSrc(null);
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const onCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleUpload = async () => {
    if (!file || !imageSrc || !croppedAreaPixels) return;

    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

      const base64String = croppedImage.split(",")[1];

      const res = await fetch(`${apiBaseUrl}api/employee/${userId}/uploadPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: "profile.png", base64Image: base64String }),
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (data.url) {
        const newUrlWithCacheBuster = `${data.url}?ts=${Date.now()}`;
        onUploadSuccess?.(newUrlWithCacheBuster);
        setImageSrc(newUrlWithCacheBuster);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload photo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {imageSrc && (
        <div className="relative w-64 h-64 bg-gray-200 rounded-full overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0 file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      <Button
        onClick={handleUpload}
        disabled={loading || !file}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Photo"}
      </Button>
    </div>
  );
}
