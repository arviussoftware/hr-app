"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";
import RouteLoader from "./loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";

interface LeaveApplication {
  employee: string;
  employeeId: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string;
  managerComments: string;
  hrComments: string;
  halfDay: boolean;
  sessionHalfDay: string;
  appliedOn: string;
}

export default function ManagerAllApplicationsList() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  // Filter statesf
  const [filterType, setFilterType] = useState<"date" | "status">("date");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<LeaveApplication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}api/manager/applications/${managerId}`
      );
      const data = await response.json();

      if (Array.isArray(data.rows)) {
        setApplications(data.rows);
        setCurrentPage(1); // reset on new fetch
      } else {
        console.error("Unexpected API format:", data);
        setApplications([]);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB").format(date).replace(/\//g, "-");
  };

  // Filtering
  const filteredApplications = applications.filter((app) => {
    // Search filter
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      app.employee.toLowerCase().includes(query) ||
      app.employeeId.toLowerCase().includes(query) ||
      app.department.toLowerCase().includes(query) ||
      app.leaveType.toLowerCase().includes(query) ||
      app.status.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Date filter
    if (filterType === "date") {
      const from = appliedFrom ? new Date(appliedFrom) : null;
      const to = appliedTo ? new Date(appliedTo) : null;

      // Normalize to ignore time
      const normalize = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate());

      const startDate = normalize(new Date(app.startDate));
      const endDate = normalize(new Date(app.endDate));

      if (from && endDate < normalize(from)) return false;
      if (to && startDate > normalize(to)) return false;
    }

    // Status filter
    if (filterType === "status" && statusFilter) {
      if (app.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    return true;
  });

  // Pagination
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
        <RouteLoader
          loading={loading}
          message={"Loading Team Applications.."}
        />
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Leave Applications</CardTitle>
              <CardDescription>
                Applications submitted by your team.
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="justify-between">
                    <span>Filter</span>
                    <CalendarDays className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[280px] space-y-4">
                  <RadioGroup
                    value={filterType}
                    onValueChange={(val: "date" | "status") => {
                      setFilterType(val);
                      setCurrentPage(1);
                    }}
                    className="flex gap-4"
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

                  {filterType === "date" && (
                    <>
                      <div>
                        <label className="text-xs">From</label>
                        <Input
                          type="date"
                          value={appliedFrom}
                          onChange={(e) => {
                            setAppliedFrom(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs">To</label>
                        <Input
                          type="date"
                          value={appliedTo}
                          onChange={(e) => {
                            setAppliedTo(e.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </div>
                    </>
                  )}

                  {filterType === "status" && (
                    <div>
                      <label className="text-xs">Select Status</label>
                      <Select
                        value={statusFilter}
                        onValueChange={(val) => {
                          setStatusFilter(val);
                          setCurrentPage(1);
                        }}
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

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAppliedFrom("");
                        setAppliedTo("");
                        setStatusFilter("");
                        setFilterType("date");
                        setCurrentPage(1);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>

          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No leave applications found.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors">
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        Employee
                      </TableHead>
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        Department
                      </TableHead>
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        Leave Type
                      </TableHead>
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        Start Date
                      </TableHead>
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        End Date
                      </TableHead>
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        Days
                      </TableHead>
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        Status
                      </TableHead>
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        Applied On
                      </TableHead>
                      <TableHead className="px-4 py-2 text-gray-700 text-left">
                        Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentApplications.map((app, idx) => (
                      <TableRow
                        key={idx}
                        className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <TableCell className="px-4 py-3 text-gray-800 font-semibold">
                          {app.employee} ({app.employeeId})
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700">
                          {app.department}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700">
                          {app.leaveType}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700">
                          {formatDate(app.startDate)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700">
                          {formatDate(app.endDate)}
                        </TableCell>
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
                        <TableCell className="px-4 py-3">
                          {getStatusBadge(app.status)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700">
                          {formatDate(app.appliedOn)}
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedApplication(app);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                  {/* Outside the table, after CardContent */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="w-full max-w-xl sm:max-w-lg md:max-w-xl mx-2 sm:mx-auto overflow-y-auto max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-sans font-semibold">
                          Application Details
                        </DialogTitle>
                      </DialogHeader>

                      {selectedApplication && (
                        <div className="grid grid-cols-2 gap-x-2 gap-y-2 py-1 text-sm sm:text-base">
                          <div className="font-medium text-gray-700">
                            Employee
                          </div>
                          <div>
                            {selectedApplication.employee} (
                            {selectedApplication.employeeId})
                          </div>

                          <div className="font-medium text-gray-700">
                            Department
                          </div>
                          <div>{selectedApplication.department}</div>

                          <div className="font-medium text-gray-700">
                            Leave Type
                          </div>
                          <div>{selectedApplication.leaveType}</div>

                          {/* Handle half-day vs full-day */}
                          <div className="font-medium text-gray-700">
                            {selectedApplication.halfDay
                              ? "Date"
                              : "Start Date"}
                          </div>
                          <div>{formatDate(selectedApplication.startDate)}</div>

                          {/* Render End Date only for full-day leaves */}
                          {!selectedApplication.halfDay && (
                            <>
                              <div className="font-medium text-gray-700">
                                End Date
                              </div>
                              <div>
                                {formatDate(selectedApplication.endDate)}
                              </div>
                            </>
                          )}

                          <div className="font-medium text-gray-700">Days</div>
                          <div>
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
                          </div>

                          <div className="font-semibold text-gray-700">
                            Reason
                          </div>
                          <div className="text-gray-600">
                            {selectedApplication.reason || "No reason"}
                          </div>

                          <div className="font-semibold text-gray-700">
                            Manager Response
                          </div>
                          <div className="text-gray-600">
                            {selectedApplication.managerComments || "—"}
                          </div>
                          <div className="font-semibold text-gray-700">
                            HR Response
                          </div>
                          <div className="text-gray-600">
                            {selectedApplication.hrComments || "—"}
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
                          <div>{formatDate(selectedApplication.appliedOn)}</div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
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
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
