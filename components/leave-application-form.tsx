"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "next-auth/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { toast } from "react-toastify";
import RouteLoader from "@/components/loader";
// import { is } from "date-fns/locale";

interface LeaveType {
  id: number;
  name: string;
  code: string;
  requiresDocument: boolean;
}

interface LeaveBalance {
  leave_type_id: number;
  leave_type_name: string;
  remaining_days: number;
  used_days?: number;
}

interface Holidays {
  id: number;
  name: string;
  holidayDate: string;
}

interface EmployeeData {
  employeeId: number;
  employeeName: string;
}

interface LeaveApplicationFormProps {
  onSuccess?: () => void;
}

export function LeaveApplicationForm({ onSuccess }: LeaveApplicationFormProps) {
  const { data: session } = useSession();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [restrictedHolidays, setRestrictedHolidays] = useState<Holidays[]>([]);
  const [selectedRestrictedHoliday, setSelectedRestrictedHoliday] = useState("");
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [document, setDocument] = useState<File | null>(null);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState("");
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);

  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  const isLoading = loadingTypes || loadingBalances || loadingHolidays;

  // Fetchers
  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    fetchLeaveBalances();
  }, [session]);

  useEffect(() => {
    if (!selectedLeaveType) {
      setError("");
      setSelectedRestrictedHoliday("");
    }

    if (selectedLeaveType && parseInt(selectedLeaveType) === 1) {
      fetchRestrictedHolidays();
    }
  }, [selectedLeaveType]);

  useEffect(() => {
    const empId = sessionStorage.getItem("empId");
    const name = sessionStorage.getItem("name");
    if (empId && name) {
      setEmployeeData({
        employeeId: parseInt(empId, 10),
        employeeName: name,
      });
    }
  }, []);

  const fetchLeaveTypes = async () => {
    setLoadingTypes(true);
    try {
      const userJson = sessionStorage.getItem("id");
      if (!userJson) throw new Error("User not logged in");
      const user = JSON.parse(userJson);
      const res = await fetch(`${API_BASE_URL}api/employee/leaveType/names/${user}`);
      const data = await res.json();
      setLeaveTypes(data.rows || []);
    } catch {
      setError("Failed to fetch leave types");
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchLeaveBalances = async () => {
    setLoadingBalances(true);
    try {
      const userJson = sessionStorage.getItem("id");
      if (!userJson) throw new Error("User not logged in");
      const user = JSON.parse(userJson);
      const res = await fetch(`${API_BASE_URL}api/employee/leaveApplyBalance/${user}`);
      const data = await res.json();
      const balances: LeaveBalance[] = data.rows.map((item: any) => ({
        leave_type_id: item.leaveId,
        leave_type_name: item.leaveName,
        remaining_days: item.remainingDays,
        used_days: item.usedDays,
      }));
      setLeaveBalances(balances);
    } catch {
      setError("Failed to fetch leave balances");
    } finally {
      setLoadingBalances(false);
    }
  };

  const fetchRestrictedHolidays = async () => {
    setLoadingHolidays(true);
    try {
      const res = await fetch(`${API_BASE_URL}api/employee/restricted`);
      const data = await res.json();
      setRestrictedHolidays(data.rows || []);
    } catch {
      setError("Failed to fetch restricted holidays");
    } finally {
      setLoadingHolidays(false);
    }
  };

  const calculateTotalDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
    }
    return isHalfDay ? 0.5 : count;
  };

  const getRemainingBalance = () => {
    if (!selectedLeaveType) return 0;
    const balance = leaveBalances.find(
      (b) => b.leave_type_id.toString() === selectedLeaveType
    );
    return balance?.remaining_days || 0;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const totalDays = calculateTotalDays();
  const remainingBalance = getRemainingBalance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    const userJson = sessionStorage.getItem("id");
    if (!userJson) {
      setError("User not logged in");
      setSubmitting(false);
      return;
    }

    if (parseInt(selectedLeaveType) === 1 && startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(startDate);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setError("Restricted holiday cannot be claimed for past dates!");
        setSubmitting(false);
        return;
      }
    }

    if (totalDays > remainingBalance) {
      setError(`Insufficient balance. You have ${remainingBalance} days.`);
      setSubmitting(false);
      return;
    }

    try {
      let documentUrl = "";
      if (document) documentUrl = `/uploads/${document.name}`;

      const res = await fetch(`${API_BASE_URL}api/employee/apply/${sessionStorage.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveType: parseInt(selectedLeaveType),
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          totalDays,
          reason,
          documentUrl,
          restrictedHolidayId: parseInt(selectedRestrictedHoliday) || null,
          isHalfDay,
          halfDaySession,
        }),
      });

      if (res.ok) {
        onSuccess?.();
        setSelectedRestrictedHoliday("");
        setStartDate(null);
        setEndDate(null);
        setReason("");
        setDocument(null);
        fetchLeaveBalances();
        toast.success("Leave applied successfully!");
      } else toast.error("Failed to apply for leave.");
    } catch (err) {
      console.error(err);
      toast.error("Leave application failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ======================= UI =======================

  return (
    <Card className="w-full max-w-2xl border-none shadow-none mx-auto bg-background">
      <RouteLoader loading={isLoading} message="Loading leave data..." />
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          {/* Alerts */}
          {message && (
            <Alert className="bg-green-50 text-green-700 border-green-200">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Employee Info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Employee Name</Label>
              <Input value={employeeData?.employeeName || ""} disabled />
            </div>
            <div>
              <Label>Employee ID</Label>
              <Input value={employeeData?.employeeId || ""} disabled />
            </div>
          </div>

          {/* Leave Type */}
          <div className="space-y-2">
            <Label>Leave Type</Label>
            {loadingTypes ? (
              <p className="text-sm text-gray-400">Loading leave types...</p>
            ) : (
              <Select
                value={selectedLeaveType}
                onValueChange={setSelectedLeaveType}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedLeaveType && (
              <p className="text-sm text-muted-foreground">
                Remaining Balance:{" "}
                <span className="font-medium text-foreground">
                  {remainingBalance} day{remainingBalance !== 1 ? "s" : ""}
                </span>
              </p>
            )}
          </div>

          {/* Restricted Holiday */}
          {parseInt(selectedLeaveType) === 1 && (
            <div className="space-y-2">
              <Label>Select Restricted Holiday</Label>
              {loadingHolidays ? (
                <p className="text-sm text-gray-400">Loading holidays...</p>
              ) : (
                <Select
                  value={selectedRestrictedHoliday}
                  onValueChange={(value) => {
                    setSelectedRestrictedHoliday(value);
                    const selected = restrictedHolidays.find(
                      (h) => h.id.toString() === value
                    );
                    if (selected) {
                      const date = new Date(selected.holidayDate);
                      setStartDate(date);
                      setEndDate(date);
                    }
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a holiday" />
                  </SelectTrigger>
                  <SelectContent>
                    {restrictedHolidays.map((h) => (
                      <SelectItem key={h.id} value={h.id.toString()}>
                        {h.name} (
                        {new Date(h.holidayDate).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Half-Day Option */}
          {(parseInt(selectedLeaveType) === 2 || parseInt(selectedLeaveType) === 3) && (
            <div className="space-y-2">
              <Label>Is this a Half-Day Leave?</Label>
              <Select
                value={isHalfDay ? "yes" : "no"}
                onValueChange={(val) => {
                  setIsHalfDay(val === "yes");
                  if (val === "no") setHalfDaySession("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>

              {/* {isHalfDay && (
                <div className="space-y-1">
                  <Label>Select Session</Label>
                  
                </div>
              )} */}
            </div>
          )}

          {/* Dates */}
          {parseInt(selectedLeaveType) !== 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    if (isHalfDay) 
                      setEndDate(date);
                  }}
                  format="dd-MM-yyyy"
                  slotProps={{
                    textField: { fullWidth: true, size: "small" },
                    popper: { disablePortal: true },
                  }}
                />
                {!isHalfDay && (
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    format="dd-MM-yyyy"
                    minDate={startDate || undefined}
                    slotProps={{
                      textField: { fullWidth: true, size: "small" },
                      popper: { disablePortal: true },
                    }}
                  />
                )}       
                {isHalfDay && (
                  <Select value={halfDaySession} onValueChange={setHalfDaySession} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First Half</SelectItem>
                      <SelectItem value="second">Second Half</SelectItem>
                    </SelectContent>
                  </Select>
                )}         
              </LocalizationProvider>
            </div>
          )}

          {/* Days Info */}
          {startDate && endDate && parseInt(selectedLeaveType) !== 1 && (
            <div className="p-3 bg-muted rounded-md text-sm flex justify-between items-center">
              <p>
                <span className="font-medium text-foreground">Total Days:</span> {totalDays}
              </p>
              {totalDays > remainingBalance && (
                <p className="text-red-500 font-medium">
                  ⚠ Exceeds remaining balance of {remainingBalance}
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="resize-none min-h-[80px]"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium transition-all"
              disabled={submitting || totalDays > remainingBalance}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
