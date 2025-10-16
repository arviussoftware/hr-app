"use client"

import { useEffect, useState, Fragment } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Users, Calendar, CheckCircle, Clock} from "lucide-react"
import { LeaveApplicationsList } from "@/components/leave-applications-list"
import { OverallUserList } from "@/components/overall-user-list"
import { EmployeesList } from "@/components/employee-details-hr"
import { Home } from "@/components/policy"
import { HolidayCalendar } from "@/components/holiday-calendar"
import { Listbox } from "@headlessui/react"
import { Check, ChevronDown } from "lucide-react"
import RouteLoader from "@/components/loader"
import { ToastContainer } from "react-toastify"

interface DashboardStats {
  totalEmployees: number
  pendingApplications: number
  approved: number
  totalLeaveTypes: number
}

type Tab = { id: string; name: string }

const TABS: Tab[] = [
  { id: "overview", name: "Overview" },
  { id: "employees", name: "Employees" },
  { id: "approvals", name: "Pending Applications" },
  { id: "reports", name: "Reports" },
  { id: "policies", name: "Policies" },
  { id: "holiday-calendar", name: "Holidays" },
]

export default function AdminDashboard() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; employeeId: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingApplications: 0,
    approved: 0,
    totalLeaveTypes: 0,
  })
  const [reportData, setReportData] = useState<any[]>([])
  const [reportRange, setReportRange] = useState({ minDate: "", maxDate: "" })
  const [reportFilters, setReportFilters] = useState({
    department: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = sessionStorage.getItem("accessToken")
    const role = sessionStorage.getItem("role")
    const name = sessionStorage.getItem("name")
    const employeeId = sessionStorage.getItem("empId")

    if (!token || role !== "hr_admin") {
      router.push("/")
    } else {
      setUser({ name: name || "", employeeId: employeeId || "", role: role || "" })
    }
  }, [router])

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true)
      setLoadingMessage("Fetching dashboard stats...")
      try {
        const response = await fetch(`${apiBaseUrl}api/hr/dashCount`)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error)
      } finally {
        setLoading(false)
        setLoadingMessage("")
      }
    }
    fetchDashboardStats()
  }, [apiBaseUrl])

  const generateReport = async () => {
    setLoading(true);
    setLoadingMessage("Generating report...");
    try {
      const params = new URLSearchParams();

      if (reportFilters.department) params.append("department", reportFilters.department);
      if (reportFilters.startDate) params.append("startDate", reportFilters.startDate);
      if (reportFilters.endDate) params.append("endDate", reportFilters.endDate);

      const url = `${apiBaseUrl}api/hr/reports?${params.toString()}`;
      console.log("API Request URL:", url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();

      if (data.rows && data.rows.length > 0) {
        setReportData(data.rows);

        // Extract global min and max from the response
        const minDate = data.rows[0].min_leave_date;
        const maxDate = data.rows[0].max_leave_date;
        setReportRange({ minDate, maxDate });
      } else {
        setReportData([]);
        setReportRange({ minDate: "", maxDate: "" });
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="container mx-auto p-2 pt-0">
      <RouteLoader loading={loading} message={loadingMessage} />
      <Tabs 
        value={activeTab} 
        onValueChange={(newTab) => {
          setActiveTab(newTab)
        }} 
        className="space-y-3"
      >
        {/* Mobile dropdown */}
        <div className="sm:hidden w-full px-2">
          <Listbox
            value={TABS.find((tab) => tab.id === activeTab)}
            onChange={(tab: Tab) => setActiveTab(tab.id)}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-xl border border-gray-300 bg-white py-3 pl-4 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <span className="block truncate">
                  {TABS.find((tab) => tab.id === activeTab)?.name}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </span>
              </Listbox.Button>

              <Listbox.Options className="absolute left-0 right-0 mt-1 max-h-60 overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                {TABS.map((tab) => (
                  <Listbox.Option key={tab.id} value={tab} as={Fragment}>
                    {({ active, selected }) => (
                      <div
                        className={`cursor-pointer select-none relative py-2 pl-4 pr-10 ${
                          active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                        }`}
                      >
                        <span
                          className={`block truncate ${selected ? "font-semibold" : "font-normal"}`}
                        >
                          {tab.name}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                            <Check className="h-5 w-5" />
                          </span>
                        )}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Desktop tabs */}
        <TabsList className="hidden sm:flex">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-1"
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="transition hover:-translate-y-1 hover:shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-gray-800 tracking-tight">
                  Total Active Employees
                </CardTitle>
                <Users className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              </CardContent>
            </Card>

            <Card className="transition hover:-translate-y-1 hover:shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-gray-800 tracking-tight">
                  Pending Leave Applications
                </CardTitle>
                <Clock className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingApplications}</div>
              </CardContent>
            </Card>

            <Card className="transition hover:-translate-y-1 hover:shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-gray-800 tracking-tight">
                  Approved Leave Applications
                </CardTitle>
                <CheckCircle className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card className="transition hover:-translate-y-1 hover:shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-gray-800 tracking-tight">
                  Leave Types
                </CardTitle>
                <Calendar className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeaveTypes}</div>
              </CardContent>
            </Card>
          </div>

          <OverallUserList showApprovalActions={true} />
        </TabsContent>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        <TabsContent value="employees">
          <EmployeesList />
        </TabsContent>

        <TabsContent value="holiday-calendar">
          <HolidayCalendar />
        </TabsContent>

        <TabsContent value="approvals">
          <LeaveApplicationsList showApprovalActions={true} />
        </TabsContent>

        <TabsContent value="reports">
          <Card className="shadow-lg border border-blue-200 rounded-2xl bg-gradient-to-b from-gray-50 to-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-2xl font-semibold text-gray-800">
                    Leave Usage Report
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    Generate detailed leave usage reports
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="department" className="text-gray-700 font-medium">
                    Department
                  </Label>
                  <select
                    id="department"
                    value={reportFilters.department}
                    onChange={(e) =>
                      setReportFilters((prev) => ({ ...prev, department: e.target.value }))
                    }
                    className="border border-blue-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Managerial">Managerial</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="startDate" className="text-gray-700 font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={reportFilters.startDate}
                    onChange={(e) =>
                      setReportFilters((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                    className="border border-blue-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <Label htmlFor="endDate" className="text-gray-700 font-medium">
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={reportFilters.endDate}
                    onChange={(e) =>
                      setReportFilters((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                    className="border border-blue-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  />
                </div>
              </div>

              {/* Button */}
              <div className="flex justify-center sm:justify-start">
                <Button
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none px-6 py-2 rounded-xl shadow-md transition-transform hover:scale-105 w-full sm:w-auto"
                  onClick={generateReport}
                >
                  Generate Report
                </Button>
              </div>

              {/* Report Table */}
              {reportData.length > 0 && (
                <div className="overflow-x-auto mt-6 rounded-lg border border-gray-200 shadow-sm">
                  <Table className="min-w-full text-sm text-gray-700">
                    <TableHeader className="bg-gray-100 text-gray-800 uppercase text-xs tracking-wider">
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Leave Type</TableHead>
                        <TableHead>Applications</TableHead>
                        <TableHead>Total Days</TableHead>
                        <TableHead>Avg Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row: any, index) => (
                        <TableRow
                          key={index}
                          className="hover:bg-blue-50 transition-colors"
                        >
                          <TableCell className="font-medium text-gray-900">
                            {row.employee}{" "}
                            <span className="text-gray-500 text-xs">
                              ({row.employeeId})
                            </span>
                          </TableCell>
                          <TableCell>{row.department}</TableCell>
                          <TableCell>{row.leaveType}</TableCell>
                          <TableCell>{row.applications}</TableCell>
                          <TableCell>{row.totalDays}</TableCell>
                          <TableCell>
                            {Number.parseFloat(row.averageDays).toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Home />
        </TabsContent>
      </Tabs>
    </div>
  )
}
