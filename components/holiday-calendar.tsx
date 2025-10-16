"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, CalendarSearch } from "lucide-react";
import RouteLoader from "./loader";
import CalendarView from "@/components/calendar";
import { motion } from "framer-motion";

interface Holiday {
  holidayName: string;
  holidayDate: string;
  holidayDay: string;
  holidayType: boolean;
}

export function HolidayCalendar() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [holidayFilter, setHolidayFilter] = useState<
    "all" | "company" | "restricted"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // New states for adding holiday
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState<Date | undefined>();
  const [holidayType, setHolidayType] = useState<"company" | "restricted">(
    "company"
  );

  // Session user id
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = sessionStorage.getItem("id");
    setUserId(id);
  }, []);

  // Fetch holidays
  useEffect(() => {
    setLoading(true);
    const fetchHolidays = async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      try {
        const response = await fetch(`${apiBaseUrl}api/hr/getHolidays`);
        if (!response.ok) throw new Error("Failed to fetch holidays");
        const data = await response.json();
        const rows: Holiday[] = data.rows || [];
        setHolidays(rows);

        const years = Array.from(
          new Set(rows.map((h) => new Date(h.holidayDate).getFullYear()))
        ).sort((a, b) => a - b);
        setAvailableYears(years);
        if (!years.includes(new Date().getFullYear())) {
          setSelectedYear(years[0]);
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Unknown error occurred");
        toast.error(error || "Failed to load holidays");
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const handleAddHoliday = async () => {
    if (!holidayName || !holidayDate) {
      toast.error("Please enter all fields");
      return;
    }

    const newHoliday = {
      holidayName,
      holidayDate: holidayDate.toLocaleDateString("en-CA"),
      holidayType,
    };

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBaseUrl}api/hr/addHoliday`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHoliday),
      });

      if (res.status === 409) {
        const err = await res.json();
        toast.error(err.message || "Holiday already exists");
        return;
      }

      if (!res.ok) throw new Error("Failed to add holiday");

      toast.success("Holiday added successfully");

      setHolidays((prev) => [
        ...prev,
        {
          holidayName,
          holidayDate: newHoliday.holidayDate,
          holidayDay: holidayDate.toLocaleDateString("en-US", {
            weekday: "long",
          }),
          holidayType: holidayType === "company", // still boolean for UI
        },
      ]);

      setHolidayName("");
      setHolidayDate(undefined);
      setHolidayType("company");
    } catch (err) {
      toast.error("Error adding holiday");
    }
  };

  if (error) return <div className="text-red-500">{error}</div>;

  const filteredHolidays = holidays
    .filter((holiday) => {
      const year = new Date(holiday.holidayDate).getFullYear();
      if (year !== selectedYear) return false;
      if (holidayFilter === "company" && !holiday.holidayType) return false;
      if (holidayFilter === "restricted" && holiday.holidayType) return false;
      if (searchQuery.trim() === "") return true;
      const query = searchQuery.toLowerCase();
      return (
        holiday.holidayName.toLowerCase().includes(query) ||
        holiday.holidayDay.toLowerCase().includes(query) ||
        formatDate(holiday.holidayDate).includes(query)
      );
    })
    .sort(
      (a, b) =>
        new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime()
    );

  const totalPages = Math.ceil(filteredHolidays.length / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage;
  const currentHolidays = filteredHolidays.slice(
    startIdx,
    startIdx + rowsPerPage
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <RouteLoader loading={loading} message={"Loading Holiday List..."} />
        <Card className="bg-white shadow-lg rounded-xl border border-blue-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl">
            <div>
              <CardTitle className="text-lg sm:text-xl font-semibold text-blue-900">
                Holiday List
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600">
                View all company and restricted holidays
              </CardDescription>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-48 bg-white rounded-lg text-blue-700">
                <Input
                  type="text"
                  placeholder="Search holidays..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pr-10 border-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 rounded-lg transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Year Selector */}
              <Select
                value={String(selectedYear)}
                onValueChange={(val) => {
                  setSelectedYear(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-24 h-9 rounded-lg text-sm border border-blue-400 bg-blue-50 text-blue-700">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Holiday Filter */}
              <Select
                value={holidayFilter}
                onValueChange={(val) => {
                  setHolidayFilter(val as "all" | "company" | "restricted");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-40 h-9 rounded-lg text-sm border border-blue-400 bg-blue-50 text-blue-700">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Holidays</SelectItem>
                  <SelectItem value="company">Company Holidays</SelectItem>
                  <SelectItem value="restricted">
                    Restricted Holidays
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Add Holiday */}
              {userId === "1" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-1 px-3 h-9 rounded-lg border border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                      <Plus className="w-4 h-4" /> Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md w-full sm:w-auto bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 rounded-lg shadow-lg">
                    <DialogHeader>
                      <DialogTitle className="text-center text-blue-900 text-lg font-semibold">
                        Add New Holiday
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 mt-3">
                      <div>
                        <Label className="text-blue-900 font-medium">
                          Holiday Name
                        </Label>
                        <Input
                          value={holidayName}
                          onChange={(e) => setHolidayName(e.target.value)}
                          placeholder="Enter holiday name"
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md"
                        />
                      </div>

                      <div>
                        <Label className="text-blue-900 font-medium">
                          Holiday Type
                        </Label>
                        <Select
                          value={holidayType}
                          onValueChange={(val) =>
                            setHolidayType(val as "company" | "restricted")
                          }
                        >
                          <SelectTrigger className="bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="company"
                              className="bg-blue-50 text-blue-900"
                            >
                              Company Holiday
                            </SelectItem>
                            <SelectItem
                              value="restricted"
                              className="bg-yellow-50 text-yellow-900"
                            >
                              Restricted Holiday
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-center my-2 w-full">
                        <div className="w-full sm:w-auto max-h-64 sm:max-h-full overflow-auto">
                          <Calendar
                            mode="single"
                            selected={holidayDate}
                            onSelect={(date: Date | undefined) =>
                              setHolidayDate(date)
                            }
                            className="bg-white rounded-md border border-gray-300 w-full"
                          />
                        </div>
                      </div>

                      {/* Live Preview */}
                      {holidayName && holidayDate && (
                        <div className="flex justify-center w-full">
                          <Card
                            className={`border w-full sm:w-80 max-h-36 overflow-hidden ${
                              holidayType === "company"
                                ? "border-blue-400 bg-blue-50"
                                : "border-yellow-400 bg-yellow-50"
                            }`}
                          >
                            <CardHeader>
                              <CardTitle className="text-sm text-blue-900 text-center">
                                {holidayName}
                              </CardTitle>
                              <CardDescription className="text-xs text-gray-700 text-center">
                                {holidayDate.toLocaleDateString("en-CA")} —{" "}
                                {holidayDate.toLocaleDateString("en-US", {
                                  weekday: "long",
                                })}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  holidayType === "company"
                                    ? "bg-blue-200 text-blue-800"
                                    : "bg-yellow-200 text-yellow-800"
                                }`}
                              >
                                {holidayType === "company"
                                  ? "Company Holiday"
                                  : "Restricted Holiday"}
                              </span>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      <Button
                        onClick={handleAddHoliday}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                        disabled={!holidayName || !holidayDate}
                      >
                        Save Holiday
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Calendar */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-1 px-3 h-9 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition">
                    <CalendarSearch className="w-4 h-4 border-blue-200" /> Calendar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <CalendarView />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          {/* Holiday Table */}
          <CardContent className="overflow-x-auto px-4 sm:px-6 py-4">
            <Table className="min-w-full divide-y divide-gray-200 text-sm">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  {["Holiday Name", "Date", "Day", "Type"].map((header) => (
                    <TableHead
                      key={header}
                      className="px-4 py-2 text-left font-semibold text-gray-700"
                    >
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200">
                {currentHolidays.map((holiday, idx) => (
                  <TableRow
                    key={idx}
                    className={`transition hover:bg-blue-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <TableCell className="px-4 py-2">
                      {holiday.holidayName}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {formatDate(holiday.holidayDate)}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      {holiday.holidayDay}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          holiday.holidayType
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {holiday.holidayType ? "Company" : "Restricted"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination */}
          <CardContent className="flex flex-wrap justify-between items-center gap-2 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Rows per page:</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(val) => {
                  setRowsPerPage(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20 h-8 rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[12, 20, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-gray-600 text-sm">
              Total Holidays: {filteredHolidays.length}
            </div>

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={i + 1 === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
