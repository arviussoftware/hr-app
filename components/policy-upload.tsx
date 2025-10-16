"use client"

import type React from "react"
import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Upload, FileText, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { type PolicyEntry } from "@/lib/policy-data"
import { motion } from "framer-motion"

interface PolicyUploadProps {
  onPolicyAdded?: (policy: PolicyEntry) => void
}

export function PolicyUpload({ onPolicyAdded }: PolicyUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tags, setTags] = useState("")
  const [uploading, setUploading] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === "application/pdf") {
        setUploadedFile(file)
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "application/pdf") {
        setUploadedFile(file)
      }
    }
  }

  const removeFile = () => setUploadedFile(null)

  const convertFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve((reader.result as string).split(",")[1])
      reader.onerror = (error) => reject(error)
    })

  const handleSubmit = async (type: "pdf" | "text") => {
    if (
      !title ||
      !description ||
      (type === "pdf" && !uploadedFile) ||
      (type === "text" && !textContent)
    ) {
      return
    }

    setUploading(true)
    try {
      let policyData: any
      if (type === "pdf" && uploadedFile) {
        const pdfBase64 = await convertFileToBase64(uploadedFile)
        policyData = {
          title,
          description,
          type: "pdf",
          uploadedBy: "HR Admin",
          uploadedAt: new Date().toISOString(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          content: null,
          pdfData: pdfBase64,
          fileName: uploadedFile.name,
        }
      } else {
        policyData = {
          title,
          description,
          type: "text",
          uploadedBy: "HR Admin",
          uploadedAt: new Date().toISOString(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          content: textContent,
          pdfData: null,
          fileName: null,
        }
      }

      const payload = {
        policies: [policyData],
        metadata: {
          lastUpdated: new Date().toISOString(),
          version: "1.0",
          totalPolicies: 0,
        },
      }

      const response = await fetch(`${baseUrl}api/hr/addPolicy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Failed to add policy")
      const result = await response.json()
      if (onPolicyAdded) {
        const latest = result?.data?.policies?.at(-1)
        onPolicyAdded(latest)
      }
      setTitle("")
      setDescription("")
      setTextContent("")
      setUploadedFile(null)
      setTags("")
    } catch (error) {
      console.error("Error adding policy:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-xl border-blue-200 border-border/60 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-2xl">
        <CardHeader className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/40 to-purple-600/40 backdrop-blur-sm" />
          <CardTitle className="relative z-10 flex items-center space-x-2 text-xl font-semibold">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Upload className="h-5 w-5" />
            </motion.div>
            <span>Add New Policy</span>
          </CardTitle>
          <CardDescription className="relative z-10 text-indigo-100">
            Upload PDF or create policy directly below
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          <Tabs defaultValue="pdf" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 rounded-xl border border-border bg-muted/40 p-1">
              <TabsTrigger
                value="pdf"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all"
              >
                PDF Upload
              </TabsTrigger>
              <TabsTrigger
                value="text"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all"
              >
                Text Entry
              </TabsTrigger>
            </TabsList>

            {/* Shared Inputs */}
            <div className="grid gap-5">
              <div>
                <Label htmlFor="title" className="font-semibold">
                  Policy Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter policy title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 border-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
              <div>
                <Label htmlFor="description" className="font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the policy"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-2 border-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
              <div>
                <Label htmlFor="tags" className="font-semibold">
                  Tags
                </Label>
                <Input
                  id="tags"
                  placeholder="e.g. hr, leave, remote-work"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mt-2 border-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple tags with commas
                </p>
              </div>
            </div>

            {/* PDF Upload */}
            <TabsContent value="pdf" className="space-y-6">
              <motion.div
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300",
                  dragActive
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-border bg-muted/30 hover:border-indigo-400",
                  uploadedFile && "border-green-500 bg-green-50 dark:bg-green-900/20"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                whileHover={{ scale: 1.02 }}
              >
                {uploadedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="font-medium text-green-700 dark:text-green-300">
                      {uploadedFile.name}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeFile}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="font-medium">Drag & drop PDF or click below</p>
                    <Label htmlFor="file-upload">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-all shadow-sm"
                      >
                        <span>Browse Files</span>
                      </Button>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </motion.div>

              <Button
                onClick={() => handleSubmit("pdf")}
                disabled={!title || !description || !uploadedFile || uploading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-md hover:opacity-90"
              >
                {uploading ? "Uploading..." : "Upload Policy"}
              </Button>
            </TabsContent>

            {/* Text Upload */}
            <TabsContent value="text" className="space-y-6">
              <div>
                <Label htmlFor="content" className="font-semibold">
                  Policy Content
                </Label>
                <Textarea
                  id="content"
                  placeholder="Enter policy content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={5}
                  className="mt-2 border-gray-300 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {textContent.length} characters
                </p>
              </div>

              <Button
                onClick={() => handleSubmit("text")}
                disabled={!title || !description || !textContent || uploading}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-md hover:opacity-90"
              >
                <FileText className="h-4 w-4 mr-2" />
                {uploading ? "Adding..." : "Add Policy"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  )
}