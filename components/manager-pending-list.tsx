"use client";

import { useEffect, useState } from "react";
import { Label } from "@radix-ui/react-dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RefreshCw, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import RouteLoader from "./loader";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface LeaveApplication {
  applicationId: number;
  employee: string;
  employeeId: number;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  appliedOn: string;
  reason: string;
  halfDay: boolean;
  sessionHalfDay: string;
}

export function ManagerPendingApplications() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<LeaveApplication | null>(null);
  const [comments, setComments] = useState("");
  const [open, setOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const managerId =
    typeof window !== "undefined" ? sessionStorage.getItem("id") : null;

  useEffect(() => {
    if (managerId) {
      fetchApplications(managerId);
    }
  }, [managerId]);

  const fetchApplications = async (managerId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}api/manager/pending/${managerId}`);
      const data = await response.json();

      debugger;
      if (Array.isArray(data.rows)) {
        setApplications(
          data.rows.map((row: any) => ({
            applicationId: row.applicationId,
            employee: row.employee,
            employeeId: row.employeeId,
            department: row.department,
            leaveType: row.leaveType,
            startDate: row.startDate,
            endDate: row.endDate,
            days: row.days,
            status: row.managerStatus,
            appliedOn: row.appliedOn,
            reason: row.reason,
            halfDay: row.halfDay,
            sessionHalfDay: row.sessionHalfDay,
          }))
        );
      } else {
        console.error("Unexpected response structure:", data);
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching manager applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const className =
      "px-3 py-1 rounded text-xs font-medium border bg-gray-100 text-gray-600";

    return (
      <span className={className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return new Intl.DateTimeFormat("en-GB").format(date).replace(/\//g, "-");
  };

  const handleApplicationAction = async (
    applicationId: number,
    action: "approved" | "rejected"
  ) => {
    if (!managerId) {
      console.error("No manager ID available in sessionStorage.");
      return;
    }

    setActionLoading(true);

    try {
      const res = await fetch(`${apiUrl}api/manager/${applicationId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId,
          action,
          comments,
        }),
      });

      if (res.ok) {
        await fetchApplications(managerId); // Refresh data
        setComments("");
        setSelectedApplication(null);
        setOpen(false);

        // Reset to page 1 if current page is out of range
        const totalPagesAfter = Math.ceil(
          (applications.length - 1) / entriesPerPage
        );
        if (currentPage > totalPagesAfter) {
          setCurrentPage(totalPagesAfter || 1);
        }
      } else {
        console.error("Failed to update application");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // 🔹 Filter applications based on search query
  const filteredApplications = applications.filter((app) => {
    const query = searchQuery.toLowerCase();
    return (
      app.employee.toLowerCase().includes(query) ||
      app.department.toLowerCase().includes(query) ||
      app.leaveType.toLowerCase().includes(query) ||
      app.status.toLowerCase().includes(query) ||
      app.employeeId.toString().includes(query)
    );
  });

  // Pagination logic
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <RouteLoader loading={loading} message={"Loading Pending.."} />
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Pending Team Leave Applications</CardTitle>
              <CardDescription>
                All pending leave requests awaiting your approval.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="relative w-full sm:w-48">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pr-8 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />

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
              <Button
                variant="outline"
                onClick={() => managerId && fetchApplications(managerId)}
                disabled={loading}
                className="relative inline-flex items-center group"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
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
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending applications found.
              </div>
            ) : (
              <>
                {/* Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Leave Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentApplications.map((app) => (
                      <TableRow key={app.applicationId}>
                        <TableCell className="font-semibold">
                          {app.employee} ({app.employeeId}){" "}
                        </TableCell>
                        <TableCell>{app.department}</TableCell>
                        <TableCell>{app.leaveType}</TableCell>
                        <TableCell>{formatDate(app.startDate)}</TableCell>
                        <TableCell>{formatDate(app.endDate)}</TableCell>
                        <TableCell>
                          {app.halfDay
                            ? `Half Day (${
                                app.sessionHalfDay.charAt(0).toUpperCase() +
                                app.sessionHalfDay.slice(1)
                              } session)`
                            : app.days === 1
                            ? `${app.days} day`
                            : `${app.days} days`}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>{formatDate(app.appliedOn)}</TableCell>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i}
                        variant={i + 1 === currentPage ? "default" : "outline"}
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}

                {/* Dialog */}
                {selectedApplication && (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Application Details</DialogTitle>
                        <DialogDescription>
                          <span className="text-md">
                            {selectedApplication.employee} (
                            {selectedApplication.employeeId}) -{" "}
                            {selectedApplication.department} Department
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
                              {selectedApplication.halfDay
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
                              handleApplicationAction(
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
                              handleApplicationAction(
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
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}