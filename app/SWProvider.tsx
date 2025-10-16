"use client"
import { useEffect } from "react"

export default function SWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.log("SW registration failed:", err))
    }
  }, [])

  return <>{children}</>
}
