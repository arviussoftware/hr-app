"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
// import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input";
import RouteLoader from "./loader";
import { motion } from "framer-motion";

interface LeaveApplication {
  applicationId: number;
  employee: string;
  employeeId: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  applied: string;
  reason?: string;
  isHalfDay: boolean;
  sessionHalfDay: string;
}

interface LeaveApplicationsListProps {
  showApprovalActions?: boolean;
  userId?: string;
}

function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "N/A";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "Invalid date";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function LeaveApplicationsList({
  showApprovalActions = false,
  userId,
}: LeaveApplicationsListProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  // const { data: session } = useSession()
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [selectedApplication, setSelectedApplication] =
    useState<LeaveApplication | null>(null);
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [filterType, setFilterType] = useState<"date" | "status">("date");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, appliedFrom, appliedTo]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}api/hr/pendingCount`);
      const data = await response.json();

      if (Array.isArray(data.rows)) {
        setApplications(data.rows);
        setCurrentPage(1); // reset to page 1 on fetch
      } else {
        console.error("Expected rows array in response:", data);
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        app.employee.toLowerCase().includes(query) || // employee name
        app.employeeId.toLowerCase().includes(query) || // employee ID
        app.leaveType.toLowerCase().includes(query) || // leave type
        app.days.toString().includes(query) || // total days
        formatDate(app.startDate).toLowerCase().includes(query) || // start date
        formatDate(app.endDate).toLowerCase().includes(query); // end date

      if (!matchesSearch) return false;
    }

    if (filterType === "date") {
      const from = appliedFrom ? new Date(appliedFrom) : null;
      const to = appliedTo ? new Date(appliedTo) : null;
      const startDate = new Date(app.startDate);
      const endDate = new Date(app.endDate);
      const appliedDate = new Date(app.applied);

      if (from && startDate < from && endDate < from && appliedDate < from)
        return false;
      if (to && startDate > to && endDate > to && appliedDate > to)
        return false;
    }

    return true;
  });

  const handleApproval = async (
    id: number,
    action: "approved" | "rejected"
  ) => {
    setActionLoading(true);

    try {
      const response = await fetch(`${apiUrl}api/hr/${id}/action`, {
        method: "POST",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          comments,
        }),
      });

      if (response.ok) {
        await fetchApplications();
        setSelectedApplication(null);
        setComments("");
      } else {
        console.error("Failed to perform action");
      }
    } catch (error) {
      console.error("Error processing approval:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let className = "px-3 py-1 rounded text-xs font-medium border";
    switch (status.toLowerCase()) {
      default:
        className +=
          "px-3 py-1 rounded-full text-xs font-medium inline-block bg-gray-100 text-gray-600";
    }

    return (
      <span className={className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredApplications.length / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentApplications = filteredApplications.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <>
      <style jsx>{`
        .table-container {
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.95),
            rgba(245, 245, 245, 0.95)
          );
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }
        .dark .table-container {
          background: linear-gradient(
            145deg,
            rgba(30, 41, 59, 0.95),
            rgba(15, 23, 42, 0.95)
          );
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        }
        .table-container:hover {
          transform: translateY(-2px);
        }
        .table-header {
          background: linear-gradient(to right, #2563eb, #3b82f6);
          color: white;
        }
        .table-header th {
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .table-row:hover {
          background-color: rgba(59, 130, 246, 0.08);
          transition: background 0.2s ease;
        }
        .search-input {
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }
        .search-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }
        .refresh-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .refresh-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }
        .pagination-btn {
          transition: all 0.2s ease;
        }
        .pagination-btn:hover {
          background-color: #2563eb;
          color: white;
        }
        .dialog-box {
          border-radius: 1rem;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.95),
            rgba(240, 240, 240, 0.95)
          );
          backdrop-filter: blur(10px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        .dark .dialog-box {
          background: linear-gradient(
            145deg,
            rgba(17, 24, 39, 0.95),
            rgba(30, 41, 59, 0.95)
          );
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <RouteLoader
          loading={loading}
          message={"Loading Pending Applications.."}
        />
        <Card className="table-container border-blue-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pending Leave Applications</CardTitle>
              <CardDescription>{showApprovalActions}</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search input with clear button */}
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="search-input w-full pr-8 border-blue-200"
                />

                {/* Clear button inside input */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Refresh button */}
              <Button
                variant="outline"
                onClick={fetchApplications}
                disabled={loading}
                className="refresh-btn relative inline-flex items-center group border-blue-200"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />

                {/* Tooltip on hover */}
                {!loading && (
                  <span
                    className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2
                                bg-gray-200 text-black text-xs rounded px-2 py-1
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  >
                    Refresh
                  </span>
                )}

                {loading && <span className="ml-2 sm:ml-0">Refreshing...</span>}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applications found
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="table-header">
                    <TableRow>
                      {showApprovalActions && (
                        <>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                        </>
                      )}
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Total Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentApplications.map((app, idx) => (
                      <TableRow
                        key={app.applicationId}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100`}
                      >
                        {showApprovalActions && (
                          <>
                            <TableCell>
                              <div>
                                <div className="text-gray-800 font-sans font-medium">
                                  {app.employee} ({app.employeeId})
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{app.department}</TableCell>
                          </>
                        )}
                        <TableCell>{app.leaveType}</TableCell>
                        <TableCell>{formatDate(app.startDate)}</TableCell>
                        <TableCell>{formatDate(app.endDate)}</TableCell>
                        <TableCell>
                          {app.days === 0.5
                            ? `Half Day (${
                                app.sessionHalfDay.charAt(0).toUpperCase() +
                                app.sessionHalfDay.slice(1)
                              } session)`
                            : app.days === 1
                            ? `${app.days} day`
                            : `${app.days} days`}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>{formatDate(app.applied)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setComments("");
                              setOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Dialog */}
                {selectedApplication && (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="dialog-box max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Application Details</DialogTitle>
                        <DialogDescription>
                          <span className="text-md">
                            {selectedApplication.employee} {"("}
                            {selectedApplication.employeeId}
                            {") - "} {selectedApplication.department}
                            {" Department"}
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Leave Type</Label>
                            <p className="text-sm mt-1">
                              {selectedApplication.leaveType}
                            </p>
                          </div>
                          <div>
                            <Label>Total Days</Label>
                            <p className="text-sm mt-1">
                              {selectedApplication.days === 0.5
                                ? `Half Day (${
                                    selectedApplication.sessionHalfDay
                                      .charAt(0)
                                      .toUpperCase() +
                                    selectedApplication.sessionHalfDay.slice(1)
                                  } session)`
                                : selectedApplication.days === 1
                                ? `${selectedApplication.days} day`
                                : `${selectedApplication.days} days`}
                            </p>
                          </div>
                          <div>
                            <Label>Start Date</Label>
                            <p className="text-sm mt-1">
                              {formatDate(selectedApplication.startDate)}
                            </p>
                          </div>
                          <div>
                            <Label>End Date</Label>
                            <p className="text-sm mt-1">
                              {formatDate(selectedApplication.endDate)}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label>Reason</Label>
                          <div className="mt-1 p-3 bg-gray-100 rounded text-sm text-muted-foreground border">
                            {selectedApplication.reason || (
                              <span className="italic text-gray-400">
                                No reason provided
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="border-t pt-4 space-y-4">
                          <div>
                            <Label>Comments (Optional)</Label>
                            <Textarea
                              id="comments"
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              placeholder="Add your comments..."
                              className="mt-2"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4 pt-2">
                          <Button
                            variant="outline"
                            className="bg-green-500 text-white hover:bg-green-600"
                            disabled={actionLoading}
                            onClick={() =>
                              handleApproval(
                                selectedApplication.applicationId,
                                "approved"
                              )
                            }
                          >
                            {actionLoading ? "Approving..." : "Approve"}
                          </Button>
                          <Button
                            variant="outline"
                            className="bg-red-500 text-white hover:bg-red-600"
                            disabled={actionLoading}
                            onClick={() =>
                              handleApproval(
                                selectedApplication.applicationId,
                                "rejected"
                              )
                            }
                          >
                            {actionLoading ? "Rejecting..." : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      className="px-3 py-1"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i}
                        className={`pagination-btn px-3 py-1 ${
                          currentPage === i + 1 ? "bg-blue-500 text-white" : ""
                        }`}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <Button
                      className="px-3 py-1"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
