"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Eye,
  Trash2,
  RefreshCw,
  Filter,
  PlusCircle,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LeaveApplicationForm } from "./leave-application-form";
import { LeaveBalanceCard } from "./leave-balance-card";
import { toast } from "react-toastify";
import RouteLoader from "./loader";
import { motion } from "framer-motion";

interface LeaveApplication {
  applicationId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  managerComments: string;
  hrComments: string;
  status: string;
  isHalfDay: boolean;
  sessionHalfDay: string;
  applied: string;
}

interface EmployeeLeaveApplicationsListProps {
  refreshTrigger: number;
  setRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
}

export function EmployeeLeaveApplicationsList({
  refreshTrigger,
  setRefreshTrigger,
}: EmployeeLeaveApplicationsListProps) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<LeaveApplication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] =
    useState<LeaveApplication | null>(null);
  const [filterType, setFilterType] = useState<"date" | "status">("date");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  const handleApplySuccess = () => {
    setIsDialogOpen(false);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const userId = sessionStorage.id;
    if (userId) fetchApplications(userId);
  }, []);

  useEffect(() => {
    const userId = sessionStorage.id;
    if (userId) fetchApplications(userId);
  }, [refreshTrigger]);

  const fetchApplications = async (userId: string) => {
    setLoading(true);
    setLoadingMessage("Loading your leave applications...");
    try {
      const response = await fetch(
        `${apiBaseUrl}api/employee/myapplications/${userId}`
      );
      const data = await response.json();
      setApplications(Array.isArray(data.rows) ? data.rows : []);
    } catch (error) {
      console.error("Failed to fetch applications", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteApplication = (app: LeaveApplication) => {
    setApplicationToDelete(app);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!applicationToDelete) return;
    setLoading(true);
    setLoadingMessage("Deleting the leave application...");
    setDeleting(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}api/employee/cancel/${applicationToDelete.applicationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setApplications((prev) =>
          prev.filter(
            (a) => a.applicationId !== applicationToDelete.applicationId
          )
        );
        toast.success("Leave application deleted successfully.");
      } else {
        toast.error("Failed to cancel application.");
      }
    } catch {
      toast.error("Error cancelling application.");
    } finally {
      setLoading(false);
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setApplicationToDelete(null);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass =
      "px-3 py-1 rounded-full text-xs font-medium inline-block capitalize shadow-sm border";
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <span
            className={`${baseClass} bg-green-100 text-green-700 border-green-300`}
          >
            Approved
          </span>
        );
      case "rejected":
        return (
          <span
            className={`${baseClass} bg-red-100 text-red-700 border-red-300`}
          >
            Rejected
          </span>
        );
      default:
        return (
          <span
            className={`${baseClass} bg-yellow-100 text-yellow-700 border-yellow-300`}
          >
            Pending
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? dateStr
      : new Intl.DateTimeFormat("en-GB").format(date).replace(/\//g, "-");
  };

  const filteredApplications = applications.filter((app) => {
    if (filterType === "date") {
      const from = appliedFrom ? new Date(appliedFrom) : null;
      const to = appliedTo ? new Date(appliedTo) : null;
      const appliedDate = new Date(app.applied);
      if (from && appliedDate < from) return false;
      if (to && appliedDate > to) return false;
    }
    if (filterType === "status" && statusFilter)
      return app.status.toLowerCase() === statusFilter.toLowerCase();
    return true;
  });

  const totalPages = Math.ceil(filteredApplications.length / entriesPerPage);
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentApplications = filteredApplications.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );

  return (
    <>
      <RouteLoader loading={loading} message={loadingMessage} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Leave Balance Section */}
        <div className="p-[1px] rounded-2xl bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 shadow-lg">
          <div className="rounded-2xl bg-white/90 backdrop-blur-sm">
            <LeaveBalanceCard refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Main Card */}
        <Card className="border-0 shadow-2xl rounded-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 backdrop-blur-sm transition hover:shadow-xl">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                Your Leave Applications
              </CardTitle>
              <CardDescription className="text-gray-500">
                Track, manage, and view your applied leaves.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-3 justify-end">
              {/* Refresh */}
              <Button
                variant="outline"
                onClick={() => {
                  const userId = sessionStorage.id;
                  if (userId) fetchApplications(userId);
                }}
                disabled={loading}
                className="hover:bg-blue-50 text-blue-700 flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              {/* Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="hover:bg-blue-50 text-blue-700 flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" /> Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-[280px] shadow-xl border-blue-100 rounded-xl"
                >
                  <RadioGroup
                    value={filterType}
                    onValueChange={(val: "date" | "status") =>
                      setFilterType(val)
                    }
                    className="flex gap-4 mb-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="date" id="date" />
                      <Label htmlFor="date">By Date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="status" id="status" />
                      <Label htmlFor="status">By Status</Label>
                    </div>
                  </RadioGroup>

                  {filterType === "date" ? (
                    <>
                      <div>
                        <label className="text-xs text-gray-600">From</label>
                        <Input
                          type="date"
                          value={appliedFrom}
                          onChange={(e) => setAppliedFrom(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">To</label>
                        <Input
                          type="date"
                          value={appliedTo}
                          onChange={(e) => setAppliedTo(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="text-xs text-gray-600">
                        Select Status
                      </label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-red-500 hover:bg-red-50 mt-3"
                    onClick={() => {
                      setAppliedFrom("");
                      setAppliedTo("");
                      setStatusFilter("");
                      setFilterType("date");
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Clear Filters
                  </Button>
                </PopoverContent>
              </Popover>

              {/* Apply Leave */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-2 shadow hover:scale-[1.03] transition">
                    <PlusCircle className="h-4 w-4" /> Apply Leave
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Apply for Leave</DialogTitle>
                  </DialogHeader>
                  <LeaveApplicationForm onSuccess={handleApplySuccess} />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          {/* Table */}
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-medium">
                No leave applications found.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <Table className="min-w-full text-sm">
                    <TableHeader>
                      <TableRow className="bg-blue-50/70">
                        {[
                          "Leave Type",
                          "Start",
                          "End",
                          "Days",
                          "Status",
                          "Applied",
                          "Actions",
                        ].map((h) => (
                          <TableHead
                            key={h}
                            className="text-gray-700 font-semibold px-4 py-3"
                          >
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentApplications.map((app) => (
                        <TableRow
                          key={app.applicationId}
                          className="even:bg-gray-50 hover:bg-blue-50/40 transition"
                        >
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
                              ? "1 Day"
                              : `${app.days} Days`}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>{formatDate(app.applied)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedApplication(app)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg rounded-2xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Application Details
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-y-2 text-sm mt-2">
                                    <div className="font-semibold text-gray-700">
                                      Leave Type
                                    </div>
                                    <div>{app.leaveType}</div>
                                    <div className="font-semibold text-gray-700">
                                      {app.isHalfDay ? "Date" : "Start Date"}
                                    </div>
                                    <div>{formatDate(app.startDate)}</div>
                                    {!app.isHalfDay && (
                                      <>
                                        <div className="font-semibold text-gray-700">
                                          End Date
                                        </div>
                                        <div>{formatDate(app.endDate)}</div>
                                      </>
                                    )}
                                    <div className="font-semibold text-gray-700">
                                      Days
                                    </div>
                                    <div>
                                      {app.days === 0.5
                                        ? `Half Day (${
                                            app.sessionHalfDay
                                              .charAt(0)
                                              .toUpperCase() +
                                            app.sessionHalfDay.slice(1)
                                          } session)`
                                        : app.days === 1
                                        ? `${app.days} day`
                                        : `${app.days} days`}
                                    </div>
                                    <div className="font-semibold text-gray-700">
                                      Reason
                                    </div>
                                    <div className="text-gray-600">
                                      {app.reason || "No reason"}
                                    </div>
                                    <div className="font-semibold text-gray-700">
                                      Manager Response
                                    </div>
                                    <div>{app.managerComments || "—"}</div>
                                    <div className="font-semibold text-gray-700">
                                      HR Response
                                    </div>
                                    <div>{app.hrComments || "—"}</div>
                                    <div className="font-semibold text-gray-700">
                                      Status
                                    </div>
                                    <div>{getStatusBadge(app.status)}</div>
                                    <div className="font-semibold text-gray-700">
                                      Applied On
                                    </div>
                                    <div>{formatDate(app.applied)}</div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {app.status.toLowerCase() === "pending" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => confirmDeleteApplication(app)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Prev
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <Button
                        key={i}
                        variant={i + 1 === currentPage ? "default" : "outline"}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
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

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 mt-2">
            Are you sure you want to cancel this leave application?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirmed}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
