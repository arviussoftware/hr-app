"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, View } from "lucide-react"

interface PDFViewerProps {
  fileName: string
  pdfData: string
  title: string
}

export function PDFViewer({ fileName, pdfData, title }: PDFViewerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDownload = () => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(pdfData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: "application/pdf" })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative inline-flex items-center group">
          <View className="h-4 w-4" />
            <span className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2
                          bg-gray-200 text-black text-xs rounded px-2 py-1
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              View PDF
            </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] p-0">
        <DialogHeader className="p-5 pb-0">
          <div className="flex items-center mt-4 mr-2 justify-between">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="p-4 pt-4">
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <iframe
              src={`data:application/pdf;base64,${pdfData}`}
              className="w-full h-[70vh]"
              title={`PDF Viewer - ${fileName}`}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">File: {fileName}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
