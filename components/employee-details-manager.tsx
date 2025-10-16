"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { RefreshCw } from "lucide-react";
import RouteLoader from "./loader";
import { motion } from "framer-motion";

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  empId: string;
  location: string;
  email: string;
}

export function EmployeesListManager() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [userId, setUserId] = useState<number | null>(null);

  const employeesPerPage = 8;

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.role.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term) ||
      emp.location.toLowerCase().includes(term) ||
      emp.empId.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
    if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const currentEmployees = sortedEmployees.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  useEffect(() => {
    const storedId = sessionStorage.getItem("id");
    if (storedId) {
      setUserId(Number(storedId));
    } else {
      console.warn("No 'id' found in sessionStorage");
    }
  }, []);

  const fetchEmployees = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const url = `${apiBaseUrl}api/manager/team/${userId}`;
      const response = await fetch(url);
      const data = await response.json();
      setEmployees(data.rows || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchEmployees();
    }
  }, [userId]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <RouteLoader loading={loading} message={"Loading Team.."} />
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                List of all the members in your team.
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative w-full sm:w-48">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pr-8 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />

                {/* Clear button inside input */}
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
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
                onClick={fetchEmployees}
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

                {/* Optional loading text */}
                {loading && <span className="ml-2 sm:ml-0">Refreshing...</span>}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              {employees.length > 0 && (
                <TableHeader>
                  <TableRow className="hover:bg-gray-50 even:bg-gray-50/40 transition-colors">
                    <TableHead
                      className="px-4 py-2 text-left cursor-pointer select-none text-gray-700"
                      onClick={() =>
                        setSortOrder((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        )
                      }
                    >
                      Name {sortOrder === "asc" ? "↑" : "↓"}
                    </TableHead>
                    <TableHead className="px-4 py-2 text-gray-700 text-left">
                      Job Role
                    </TableHead>
                    <TableHead className="px-4 py-2 text-gray-700 text-left">
                      Department
                    </TableHead>
                    <TableHead className="px-4 py-2 text-gray-700 text-left">
                      Employee Id
                    </TableHead>
                    <TableHead className="px-4 py-2 text-gray-700 text-left">
                      Work Mode
                    </TableHead>
                    <TableHead className="px-4 py-2 text-gray-700 text-left">
                      Email
                    </TableHead>
                  </TableRow>
                </TableHeader>
              )}
              <TableBody>
                {currentEmployees.length > 0 ? (
                  currentEmployees.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className="even:bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <TableCell className="px-4 py-3 text-gray-800 font-sans font-medium">
                        {emp.name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800">
                        {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800">
                        {emp.department}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800">
                        {emp.empId}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800">
                        {emp.location}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-800">
                        {emp.email}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-6"
                    >
                      No employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
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
