"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ProfilePhotoProps {
  userId: number;
  className?: string;
  size?: number;
  src?: string;
}

export function ProfilePhoto({ userId, className = "", size = 128, src }: ProfilePhotoProps) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const defaultUrl = `${apiBaseUrl}api/employee/${userId}/photo`;

  const [imgSrc, setImgSrc] = useState(src ?? defaultUrl);

  // Sync with prop changes
  useEffect(() => {
    setImgSrc(src ?? defaultUrl);
  }, [src, defaultUrl]);

  return (
    <Image
      src={imgSrc + `?ts=${Date.now()}`} // optional extra cache-buster
      alt="Profile Photo"
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      onError={() => setImgSrc("/dummy-user.png")}
      unoptimized
    />
  );
}
