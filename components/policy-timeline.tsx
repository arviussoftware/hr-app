"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileCheck2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type PolicyEntry } from "@/lib/policy-data";
import { PDFViewer } from "./pdf-viewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RouteLoader from "./loader";
import { motion } from "framer-motion";

interface PolicyTimelineProps {
  refreshTrigger?: number;
}

export function PolicyTimeline({ refreshTrigger }: PolicyTimelineProps) {
  const [policies, setPolicies] = useState<PolicyEntry[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [policyToDelete, setPolicyToDelete] = useState<PolicyEntry | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const userId = sessionStorage.id;

  useEffect(() => {
    const fetchPolicies = async () => {
      setLoading(true);
      setLoadingMessage("Loading Policies...");
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${baseUrl}api/hr/policies`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch policies");
        const data = await res.json();
        setPolicies(data.policies || data.data || []);
      } catch (error) {
        console.error("Error fetching policies:", error);
        setPolicies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [refreshTrigger]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedItems(newExpanded);
  };

  const handleDownloadPDF = (policy: PolicyEntry) => {
    if (policy.type === "pdf" && policy.pdfData && policy.fileName) {
      try {
        const byteCharacters = atob(policy.pdfData);
        const byteNumbers = Array.from(byteCharacters).map((c) =>
          c.charCodeAt(0)
        );
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = policy.fileName;
        link.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading PDF:", error);
      }
    }
  };

  const handleDeletePolicy = async () => {
    if (!policyToDelete) return;
    setIsDeleting(true);
    try {
      setLoading(true);
      setLoadingMessage("Deleting policy...");
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(
        `${baseUrl}api/hr/deletePolicy/${policyToDelete.id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Failed to delete policy");
      setPolicies((prev) => prev.filter((p) => p.id !== policyToDelete.id));
      setPolicyToDelete(null);
    } catch (error) {
      console.error("Error deleting policy:", error);
    } finally {
      setIsDeleting(false);
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <RouteLoader loading={loading} message={loadingMessage} />
        <Card className="hover:shadow-xl border border-border/40 border-blue-200 rounded-2xl bg-gradient-to-br from-background via-muted/30 to-background backdrop-blur-md transition-all duration-500">
          <CardHeader className="pb-3 border-b border-border/30">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
              Policy Timeline
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5"
              >
                {policies.length}{" "}
                {policies.length === 1 ? "Policy" : "Policies"}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Track and manage all organization policies in one place.
            </CardDescription>
          </CardHeader>

          <div className="space-y-5 h-[660px] overflow-auto px-3 sm:px-6 py-4 scrollbar-thin scrollbar-thumb-accent/40 hover:scrollbar-thumb-accent/60">
            {policies.length === 0 ? (
              <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/10 rounded-xl text-center p-10">
                <CardContent>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                  <p className="text-muted-foreground">
                    No policies found. Upload your first policy!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Timeline */}
                <div className="hidden md:block relative pl-8">
                  <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-accent/50 via-border to-accent/50 rounded-full" />
                  <div className="space-y-6">
                    {policies.map((policy) => (
                      <div
                        key={policy.id}
                        className="relative flex items-start gap-5 group"
                      >
                        {/* Marker */}
                        <div className="absolute left-[-2.3rem] mt-2 flex items-center justify-center w-10 h-10 rounded-full bg-accent text-accent-foreground shadow-md group-hover:scale-110 group-hover:shadow-lg transition-transform duration-300">
                          {policy.type === "pdf" ? (
                            <FileCheck2 className="h-5 w-5" />
                          ) : (
                            <FileText className="h-5 w-5" />
                          )}
                        </div>
                        {/* Card */}
                        <div className="flex-1">
                          <PolicyCard
                            policy={policy}
                            expandedItems={expandedItems}
                            toggleExpanded={toggleExpanded}
                            userId={userId}
                            setPolicyToDelete={setPolicyToDelete}
                            handleDownloadPDF={handleDownloadPDF}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile View */}
                <div className="block md:hidden space-y-4">
                  {policies.map((policy) => (
                    <PolicyCard
                      key={policy.id}
                      policy={policy}
                      expandedItems={expandedItems}
                      toggleExpanded={toggleExpanded}
                      userId={userId}
                      setPolicyToDelete={setPolicyToDelete}
                      handleDownloadPDF={handleDownloadPDF}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Delete Confirmation */}
          <Dialog
            open={!!policyToDelete}
            onOpenChange={() => setPolicyToDelete(null)}
          >
            <DialogContent className="sm:max-w-md rounded-xl shadow-2xl bg-card/95 backdrop-blur-md border-red-200">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-destructive">
                  Confirm Deletion?
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-900 mt-2 ml-2 mr-2">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-foreground">
                  {policyToDelete?.title}
                </span>
                ? <br />
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-3">
                <Button
                  variant="outline"
                  onClick={() => setPolicyToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePolicy}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </Card>
      </motion.div>
    </>
  );
}

/* ---- Sub Component ---- */
function PolicyCard({
  policy,
  expandedItems,
  toggleExpanded,
  userId,
  setPolicyToDelete,
  handleDownloadPDF,
}: {
  policy: PolicyEntry;
  expandedItems: Set<string>;
  toggleExpanded: (id: string) => void;
  userId: string;
  setPolicyToDelete: (p: PolicyEntry) => void;
  handleDownloadPDF: (p: PolicyEntry) => void;
}) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="transition-all duration-300 border border-border/50 rounded-xl bg-gradient-to-tr from-background via-card/70 to-background hover:shadow-lg hover:scale-[1.01] backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold tracking-tight">
                {policy.title}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {policy.description}
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "uppercase text-xs px-2 py-1",
                policy.type === "pdf"
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-amber-100 text-amber-700 border-amber-200"
              )}
            >
              {policy.type}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{policy.uploadedBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(policy.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* PDF Section */}
          {policy.type === "pdf" && policy.fileName && policy.pdfData && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg border border-border/30 transition-all duration-300 hover:bg-muted/60">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium truncate">
                  {policy.fileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PDFViewer
                  fileName={policy.fileName}
                  pdfData={policy.pdfData}
                  title={policy.title}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadPDF(policy)}
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                {userId === "1" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setPolicyToDelete(policy)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Text Section */}
          {policy.type === "text" && policy.content && (
            <div className="space-y-3">
              <div
                style={{ whiteSpace: "pre-line" }}
                className={cn(
                  "text-sm leading-relaxed text-foreground transition-all duration-300",
                  !expandedItems.has(policy.id) && "line-clamp-3"
                )}
              >
                {policy.content}
              </div>
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary transition-all duration-300"
                  onClick={() => toggleExpanded(policy.id)}
                >
                  {expandedItems.has(policy.id) ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1 rotate-180 transition-transform duration-300" />{" "}
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1 transition-transform duration-300" />{" "}
                      Show more
                    </>
                  )}
                </Button>
                {userId === "1" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setPolicyToDelete(policy)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
