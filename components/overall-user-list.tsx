"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Filter } from "lucide-react";
// import { useSession } from "next-auth/react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import RouteLoader from "./loader";
import { motion } from "framer-motion";

interface LeaveApplication {
  id: number;
  employee: string;
  employeeId: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  managerComments: string;
  hrComments: string;
  status: string;
  appliedOn: string;
  halfDay: boolean;
  sessionHalfDay: string;
}

interface LeaveApplicationsListProps {
  showApprovalActions?: boolean;
  userId?: string;
}

function formatDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function OverallUserList({
  showApprovalActions = false,
  userId,
}: LeaveApplicationsListProps) {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedApplication, setSelectedApplication] =
    useState<LeaveApplication | null>(null);

  const entriesPerPage = 6;

  const [filterType, setFilterType] = useState<"date" | "status">("date");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/hr/overallCount`
      );
      const data = await response.json();
      if (Array.isArray(data.rows)) {
        setApplications(data.rows);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "px-3 py-1 rounded-full text-xs font-medium inline-block";

    switch (status.toLowerCase()) {
      case "approved":
        return (
          <span className={`${baseClass} bg-green-100 text-green-700`}>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClass} bg-red-100 text-red-700`}>
            Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseClass} bg-gray-100 text-gray-600`}>
            {status}
          </span>
        );
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        app.employee.toLowerCase().includes(query) ||
        app.department.toLowerCase().includes(query) ||
        app.leaveType.toLowerCase().includes(query) ||
        app.days.toString().includes(query);
      if (!matchesSearch) return false;
    }

    if (filterType === "date") {
      const from = appliedFrom ? new Date(appliedFrom) : null;
      const to = appliedTo ? new Date(appliedTo) : null;
      const startDate = new Date(app.startDate);
      const endDate = new Date(app.endDate);
      const appliedDate = new Date(app.appliedOn);

      if (from && startDate < from && endDate < from && appliedDate < from)
        return false;
      if (to && startDate > to && endDate > to && appliedDate > to)
        return false;
    }

    if (filterType === "status" && statusFilter) {
      return app.status.toLowerCase() === statusFilter.toLowerCase();
    }

    return true;
  });

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentApplications = filteredApplications.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );
  const totalPages = Math.ceil(filteredApplications.length / entriesPerPage);

  const handlePageChange = (page: number) => {
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
        <RouteLoader loading={loading} message="Loading Applications" />
        <Card className="border-blue-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:overflow-hidden">
            <div className="w-full sm:w-auto">
              <CardTitle>All Leave Applications</CardTitle>
              <CardDescription>{showApprovalActions}</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
              <div className="relative w-full sm:w-48">
                {" "}
                {/* Reduced width here */}
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pr-8 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
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
                onClick={fetchApplications}
                disabled={loading}
                className="relative inline-flex items-center group border-blue-200"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""} text-blue-700`}
                />
                <span className="text-blue-700">Refresh</span>

                {loading && <span className="ml-2 sm:ml-0">Refreshing...</span>}
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
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200">
                  {showApprovalActions && (
                    <>
                      <TableHead className="text-left font-semibold text-gray-700">
                        Employee
                      </TableHead>
                      <TableHead className="text-left font-semibold text-gray-700">
                        Department
                      </TableHead>
                    </>
                  )}
                  <TableHead className="text-left font-semibold text-gray-700">
                    Leave Type
                  </TableHead>
                  <TableHead className="text-left font-semibold text-gray-700">
                    Start Date
                  </TableHead>
                  <TableHead className="text-left font-semibold text-gray-700">
                    End Date
                  </TableHead>
                  <TableHead className="text-left font-semibold text-gray-700">
                    Days
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-semibold text-gray-700">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentApplications.map((app, idx) => (
                  <TableRow
                    key={app.id}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100`}
                  >
                    {showApprovalActions && (
                      <>
                        <TableCell className="py-3">
                          <div className="font-medium text-gray-900 font-sans">
                            {app.employee} ({app.employeeId})
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-gray-700">
                          {app.department}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="py-3">{app.leaveType}</TableCell>
                    <TableCell className="py-3">
                      {formatDate(app.startDate)}
                    </TableCell>
                    <TableCell className="py-3">
                      {formatDate(app.endDate)}
                    </TableCell>
                    <TableCell className="py-3">
                      {app.days === 0.5
                        ? `Half Day (${
                            app.sessionHalfDay.charAt(0).toUpperCase() +
                            app.sessionHalfDay.slice(1)
                          } session)`
                        : app.days === 1
                        ? `${app.days} day`
                        : `${app.days} days`}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      {getStatusBadge(app.status)}
                    </TableCell>
                    <TableCell className="py-3 text-center">
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

                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-sans font-semibold">
                              Application Details
                            </DialogTitle>
                          </DialogHeader>

                          {selectedApplication && (
                            <div className="grid grid-cols-2 gap-x-0 gap-y-2 py-2 text-sm">
                              <div className="font-medium text-gray-700">
                                Employee Name
                              </div>
                              <div>{selectedApplication.employee}</div>

                              <div className="font-medium text-gray-700">
                                Leave Type
                              </div>
                              <div>{selectedApplication.leaveType}</div>

                              <div className="font-semibold text-gray-700">
                                {selectedApplication.halfDay
                                  ? "Date"
                                  : "Start Date"}
                              </div>
                              <div>
                                {formatDate(selectedApplication.startDate)}
                              </div>
                              {!selectedApplication.halfDay && (
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
                                {selectedApplication.days === 0.5
                                  ? `Half Day (${
                                      selectedApplication.sessionHalfDay
                                        .charAt(0)
                                        .toUpperCase() +
                                      selectedApplication.sessionHalfDay.slice(
                                        1
                                      )
                                    } session)`
                                  : selectedApplication.days === 1
                                  ? `${selectedApplication.days} day`
                                  : `${selectedApplication.days} days`}
                              </div>

                              <div className="font-medium text-gray-700">
                                Reason:
                              </div>
                              <div className="bg-gray-100 p-1 pl-2 rounded text-gray-700">
                                {selectedApplication.reason || (
                                  <span className="italic text-gray-400">
                                    No reason provided
                                  </span>
                                )}
                              </div>

                              <div className="font-medium text-gray-700">
                                Manger Response:
                              </div>
                              <div className="bg-gray-100 p-1 pl-2 rounded text-gray-700">
                                {selectedApplication.managerComments || (
                                  <span className="italic text-gray-400">
                                    No Manager comments
                                  </span>
                                )}
                              </div>

                              <div className="font-medium text-gray-700">
                                HR Response:
                              </div>
                              <div className="bg-gray-100 p-1 pl-2 rounded text-gray-700">
                                {selectedApplication.hrComments || (
                                  <span className="italic text-gray-400">
                                    No HR feedback provided
                                  </span>
                                )}
                              </div>

                              <div className="font-medium text-gray-700">
                                Status
                              </div>
                              <div>
                                {getStatusBadge(selectedApplication.status)}
                              </div>

                              <div className="font-medium text-gray-700">
                                Applied On
                              </div>
                              <div>
                                {formatDate(selectedApplication.appliedOn)}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredApplications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No applications found
              </div>
            )}

            {filteredApplications.length > entriesPerPage && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    className={`px-3 ${
                      i + 1 === currentPage
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "bg-white text-black border hover:bg-gray-100"
                    }`}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
