"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeePreview } from "@/components/employee-preview";
import { RefreshCw, UserPlusIcon } from "lucide-react";
import { Camera, Upload } from "lucide-react";
import { toast } from "react-toastify";
import RouteLoader from "./loader";
import "react-toastify/dist/ReactToastify.css";
import CameraCapture from "./CameraCapture";
import { motion } from "framer-motion";

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  empId: string;
  location: string;
}

interface CreateUserForm {
  fullName: string;
  firstName: string;
  lastName: string;
  sameAsPresent: boolean;
  email: string;
  contactNumber: number | null;
  gender: string;
  dateOfBirth: string;
  permanentAddress: string;
  presentAddress: string;
  employeeId: string;
  hireDate: string;
  department: string;
  bloodGroup?: string;
  role: string;
  managerId: number | null;
  location: string;
  skills: string;
  eduDegree: string;
  eduBranch: string;
  eduUniversity: string;
  eduGrade: number | null;
  eduYear: string;
  emergencyName: string;
  emergencyNumber: number | null;
  emergencyRelationship: string;
  emergencyEmail: string | null;
  emergencyAddress: string;
}

const labelsMap: Record<keyof CreateUserForm, string> = {
  fullName: "Full Name*",
  firstName: "First Name*",
  lastName: "Last Name*",
  email: "Email*",
  contactNumber: "Contact Number*",
  gender: "Gender*",
  dateOfBirth: "Date of Birth*",
  permanentAddress: "Permanent Address",
  presentAddress: "Present Address",
  employeeId: "Employee ID*",
  hireDate: "Date of Joining*",
  department: "Department*",
  bloodGroup: "Blood Group",
  role: "Role*",
  managerId: "Manager*",
  location: "Location*",
  skills: "Skills",
  eduDegree: "Degree",
  eduBranch: "Branch",
  eduUniversity: "University",
  eduGrade: "Grade",
  eduYear: "Completion Year",
  emergencyName: "Name*",
  emergencyNumber: "Contact Number*",
  emergencyRelationship: "Relationship*",
  emergencyEmail: "Email",
  emergencyAddress: "Address",
  sameAsPresent: "Same as Present Address",
};

const initialFormState: CreateUserForm = {
  fullName: "",
  firstName: "",
  lastName: "",
  sameAsPresent: false,
  email: "",
  contactNumber: null,
  gender: "",
  dateOfBirth: "",
  permanentAddress: "",
  presentAddress: "",
  employeeId: "",
  hireDate: "",
  department: "",
  bloodGroup: "",
  role: "",
  managerId: null,
  location: "",
  skills: "",
  eduDegree: "",
  eduBranch: "",
  eduUniversity: "",
  eduGrade: null,
  eduYear: "",
  emergencyName: "",
  emergencyNumber: null,
  emergencyRelationship: "",
  emergencyEmail: "",
  emergencyAddress: "",
};

export function EmployeesList() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [formData, setFormData] = useState<CreateUserForm>(initialFormState);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "empId" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showActive, setShowActive] = useState(true);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateUserForm, string>>
  >({});
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const employeesPerPage = 10;

  const filteredEmployees = employees
    .filter((emp) => {
      const term = searchTerm.toLowerCase();
      return (
        emp.name.toLowerCase().includes(term) ||
        emp.role.toLowerCase().includes(term) ||
        emp.department.toLowerCase().includes(term) ||
        emp.location.toLowerCase().includes(term) ||
        emp.empId.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const fieldA = a[sortField].toString().toLowerCase();
      const fieldB = b[sortField].toString().toLowerCase();
      if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const currentEmployees = filteredEmployees.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  useEffect(() => {
    fetchEmployees();
  }, [showActive]);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}api/hr/managerList`);
        if (!res.ok) throw new Error("Failed to fetch managers");
        const data = await res.json();
        setManagers(data.rows || []); // <-- use data.rows
      } catch (err) {
        console.error("Error fetching managers:", err);
        setManagers([]);
      }
    };
    fetchManagers();
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // includes data:image/... prefix
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // return only the base64 part
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // const onCapture = (base64: string, file: File) => {
  //   setSelectedPhotoFile(file);
  //   setPhotoPreview(base64);
  // };

  // const startCamera = async () => {
  //   const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
  //   videoRef.current!.srcObject = mediaStream;
  //   setStream(mediaStream);
  // };

  const fetchEmployees = async () => {
    setLoading(true);
    setLoadingMessage("Loading Employees..");
    try {
      const activeUrl = `${apiBaseUrl}api/hr/employeeData`;
      const inactiveUrl = `${apiBaseUrl}api/hr/employeeData/inactive`;
      const [activeRes, inactiveRes] = await Promise.all([
        fetch(activeUrl),
        fetch(inactiveUrl),
      ]);
      const activeData = await activeRes.json();
      const inactiveData = await inactiveRes.json();
      const activeRows = activeData.rows || [];
      const inactiveRows = inactiveData.rows || [];
      const combinedRows = [...activeRows, ...inactiveRows];
      setAllEmployees(combinedRows);
      setEmployees(showActive ? activeRows : inactiveRows);
      const nextId = getNextEmployeeId(combinedRows);
      setFormData((prev) => ({ ...prev, employeeId: nextId }));
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const getNextEmployeeId = (employees: Employee[]): string => {
    const ids = employees
      .map((e) => e.empId)
      .filter((id) => id.startsWith("2023"))
      .map((id) => Number(id))
      .filter((num) => !isNaN(num));
    if (ids.length === 0) return "2023001";
    const maxId = Math.max(...ids);
    return String(maxId + 1);
  };

  const handlePhotoSelect = (file: File) => {
    if (file.size > 1048576) {
      toast.error("Profile photo must be less than 1 MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    setSelectedPhotoFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSort = (field: "name") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleChange = (
    field: keyof CreateUserForm,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]:
        field === "contactNumber" ||
        field === "managerId" ||
        field === "eduGrade"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePreview = (userId: number) => {
    setSelectedEmployeeId(userId);
    setPreviewOpen(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setStep(1);
    setErrors({});
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof CreateUserForm, string>> = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim())
        newErrors.fullName = "Full name is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email))
        newErrors.email = "Invalid email format";
      if (
        !formData.contactNumber ||
        String(formData.contactNumber).length !== 10
      )
        newErrors.contactNumber = "Must be 10 digits";
      if (!formData.dateOfBirth)
        newErrors.dateOfBirth = "Date of Birth is required";
    }

    if (currentStep === 2) {
      if (!formData.employeeId.trim())
        newErrors.employeeId = "Employee ID is required";
      if (!formData.hireDate) newErrors.hireDate = "Hire date is required";
      if (!formData.managerId) newErrors.managerId = "Manager is required";
      if (!formData.department.trim())
        newErrors.department = "Department is required";
      if (!formData.role.trim()) newErrors.role = "Role is required";
      if (!formData.location.trim())
        newErrors.location = "Location is required";
    }

    if (currentStep === 4) {
      if (!formData.emergencyName.trim())
        newErrors.emergencyName = "Emergency contact name is required";
      if (!formData.emergencyRelationship.trim())
        newErrors.emergencyRelationship = "Relationship is required";
      if (
        !formData.emergencyNumber ||
        String(formData.emergencyNumber).length !== 10
      )
        newErrors.emergencyNumber = "Must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    } else {
      toast.error("Please fill all fields marked with asterisk!");
    }
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleCreateUser = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);
      setLoadingMessage("Creating user...");

      let base64Photo: string | null = null;
      if (selectedPhotoFile) {
        base64Photo = await toBase64(selectedPhotoFile);
      }

      const names = formData.fullName.trim().split(" ");
      const firstName = names.shift() || "";
      const lastName = names.join(" ") || "";

      const { fullName, sameAsPresent, ...remaining } = formData;

      const payload = {
        ...remaining,
        firstName,
        lastName,
        DateOfBirth: new Date(formData.dateOfBirth),
        HireDate: new Date(formData.hireDate),
        ContactNumber: formData.contactNumber,
        EmergencyNumber: formData.emergencyNumber,
        PermanentAddress: formData.permanentAddress || null,
        ProfilePhotoBase64: base64Photo, // Base64 string
        ProfilePhotoFileName: selectedPhotoFile?.name || null,
      };

      const response = await fetch(`${apiBaseUrl}api/hr/createUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to create user");
      // const newUser = await response.json();

      toast.success("User created successfully!");
      setOpen(false);
      resetForm();
      fetchEmployees();
      setSelectedPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <RouteLoader loading={loading} message={loadingMessage} />
        <Card className="bg-gradient-to-br from-white to-blue-50 shadow-lg border border-blue-200 rounded-2xl transition-all duration-300 hover:shadow-xl">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 bg-white/70 backdrop-blur-md rounded-t-2xl">
            <div className="flex items-center gap-4">
              <CardTitle
                // className={`font-semibold ${
                //   showActive ? "text-green-600" : "text-red-600"
                // }`}
              >
                {showActive ? "Active Employees" : "Inactive Employees"}
              </CardTitle>

              <Button
                variant="outline"
                size="sm"
                className={`border-gray-300 ${
                  showActive
                    ? "text-red-700 hover:bg-red-100 border-red-200"
                    : "text-green-700 hover:bg-green-100 border-green-200"
                }`}
                onClick={() => setShowActive((prev) => !prev)}
              >
                {showActive ? "Show Inactive" : "Show Active"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative w-full sm:w-56">
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pr-8 pl-3 py-2 shadow-sm border border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={fetchEmployees}
                disabled={loading}
                className="relative inline-flex items-center group border-blue-200"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />

                {/* Tooltip on hover */}
                {!loading && (
                  <span
                    className="absolute bottom-full mt-1 left-1/2 transform -translate-x-1/2
                                bg-gray-200 text-black text-xs rounded px-2 py-1
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  >
                    Refresh
                  </span>
                )}

                {/* Optional loading text */}
                {loading && <span className="ml-2 sm:ml-0">Refreshing...</span>}
              </Button>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 shadow-md hover:scale-[1.03] transition-transform"
                onClick={() => {
                  const nextId = getNextEmployeeId(allEmployees);
                  setFormData((prev) => ({ ...prev, employeeId: nextId }));
                  setOpen(true);
                }}
              >
                <UserPlusIcon className="w-4 h-4 mr-2 sm:" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-gray-100 text-gray-700 sticky top-0 z-10">
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("name")}
                    className="cursor-pointer select-none hover:text-blue-600 flex items-center gap-1"
                  >
                    Name
                    {sortField === "name" && (
                      <span className="text-gray-500 text-xs">
                        {sortDirection === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Job Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Work Mode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentEmployees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className="even:bg-blue-50/10 hover:bg-blue-50 transition-colors duration-200"
                  >
                    <TableCell className="font-medium text-gray-800">
                      {emp.name}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {emp.department}
                    </TableCell>
                    <TableCell className="text-gray-700">{emp.empId}</TableCell>
                    <TableCell className="text-gray-700">
                      {emp.location}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-blue-600 hover:bg-blue-100"
                        onClick={() => handlePreview(emp.id)}
                      >
                        Preview
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  className="border border-gray-400 text-gray-700 hover:bg-gray-200 shadow-sm"
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
                  className="border border-gray-400 text-gray-700 hover:bg-gray-200 shadow-sm"
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

        {/* Dialog for Create User */}
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) resetForm();
            setOpen(isOpen);
          }}
        >
          <DialogContent className="max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl shadow-2xl transition-all duration-300">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 4) {
                  handleCreateUser();
                } else {
                  handleNext();
                }
              }}
              className="flex flex-col gap-6 p-4"
            >
              <div className="flex-1 flex flex-col gap-4 p-1">
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold text-center text-blue-600">
                      Personal Information
                    </h2>
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor="fullName">Name*</Label>
                      <Input
                        className={`px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all ${
                          errors.firstName
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-400"
                        }`}
                        id="fullName"
                        type="text"
                        value={formData.fullName || ""}
                        onChange={(e) =>
                          handleChange("fullName", e.target.value)
                        }
                      />
                      {errors.fullName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="email">{labelsMap.email}</Label>
                        <Input
                          className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleChange("email", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="contactNumber">
                          {labelsMap.contactNumber}
                        </Label>
                        <Input
                          className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                          id="contactNumber"
                          type="tel"
                          inputMode="numeric"
                          value={formData.contactNumber ?? ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 10) {
                              setFormData((prev) => ({
                                ...prev,
                                contactNumber:
                                  value === "" ? null : Number(value),
                              }));
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="gender">{labelsMap.gender}</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(val) => handleChange("gender", val)}
                        >
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="dateOfBirth">
                          {labelsMap.dateOfBirth}
                        </Label>
                        <Input
                          className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) =>
                            handleChange("dateOfBirth", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor="presentAddress">
                        {labelsMap.presentAddress}
                      </Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="presentAddress"
                        type="text"
                        value={formData.presentAddress}
                        onChange={(e) =>
                          handleChange("presentAddress", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-400"
                        type="checkbox"
                        id="sameAsPresent"
                        checked={formData.sameAsPresent || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            sameAsPresent: checked,
                            permanentAddress: checked
                              ? prev.presentAddress
                              : "",
                          }));
                        }}
                      />
                      <Label htmlFor="sameAsPresent">Same as Above</Label>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor="permanentAddress">
                        {labelsMap.permanentAddress}
                      </Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="permanentAddress"
                        type="text"
                        value={formData.permanentAddress}
                        onChange={(e) =>
                          handleChange("permanentAddress", e.target.value)
                        }
                        disabled={formData.sameAsPresent}
                      />
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold text-center text-blue-600">
                      Professional Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="employeeId">
                          {labelsMap.employeeId}
                        </Label>
                        <Input
                          className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                          id="employeeId"
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) =>
                            handleChange("employeeId", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="hireDate">{labelsMap.hireDate}</Label>
                        <Input
                          className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                          id="hireDate"
                          type="date"
                          value={formData.hireDate}
                          onChange={(e) =>
                            handleChange("hireDate", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="department">
                          {labelsMap.department}
                        </Label>
                        <Select
                          value={formData.department}
                          onValueChange={(val) =>
                            handleChange("department", val)
                          }
                        >
                          <SelectTrigger id="department" className="w-full">
                            <SelectValue placeholder="Select Department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="Engineering">
                                Engineering
                              </SelectItem>
                              <SelectItem value="Manager">
                                Managerial
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="bloodGroup">
                          {labelsMap.bloodGroup}
                        </Label>
                        <Select
                          value={formData.bloodGroup}
                          onValueChange={(val) =>
                            handleChange("bloodGroup", val)
                          }
                        >
                          <SelectTrigger id="bloodGroup" className="w-full">
                            <SelectValue placeholder="Select Blood Group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {[
                                "A+",
                                "B+",
                                "AB+",
                                "O+",
                                "O-",
                                "AB-",
                                "B-",
                                "A-",
                              ].map((bg) => (
                                <SelectItem key={bg} value={bg}>
                                  {bg}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="role">{labelsMap.role}</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(val) => handleChange("role", val)}
                        >
                          <SelectTrigger id="role" className="w-full">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="employee">Employee</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <Label>Profile Picture</Label>
                        <div className="flex items-center gap-4">
                          {/* Upload */}
                          <label
                            htmlFor="photoUpload"
                            className="cursor-pointer p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                          >
                            <Upload className="w-6 h-6 text-gray-600" />
                          </label>
                          <input
                            id="photoUpload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0])
                                handlePhotoSelect(e.target.files[0]);
                            }}
                          />

                          {/* Camera Icon */}
                          <button
                            type="button"
                            onClick={() => setPhotoModalOpen(true)}
                            className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                          >
                            <Camera className="w-6 h-6 text-gray-600" />
                          </button>

                          {/* Preview */}
                          {photoPreview && (
                            <img
                              src={photoPreview}
                              alt="Profile Preview"
                              className="w-16 h-16 object-cover rounded-full border-2 border-blue-400 shadow-md"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="managerId">{labelsMap.managerId}</Label>
                        <Select
                          value={formData.managerId?.toString() || ""}
                          onValueChange={(val) =>
                            handleChange("managerId", Number(val))
                          }
                        >
                          <SelectTrigger id="managerId">
                            <SelectValue placeholder="Select Manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {managers.map((manager) => (
                                <SelectItem
                                  key={manager.id}
                                  value={manager.id.toString()}
                                >
                                  {manager.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        <Label htmlFor="location">{labelsMap.location}</Label>
                        <Select
                          value={formData.location}
                          onValueChange={(val) => handleChange("location", val)}
                        >
                          <SelectTrigger id="location">
                            <SelectValue placeholder="Select Location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="In Office">
                                In Office
                              </SelectItem>
                              <SelectItem value="Remote">Remote</SelectItem>
                              <SelectItem value="Hybrid">Hybrid</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="skills">{labelsMap.skills}</Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="skills"
                        type="text"
                        value={formData.skills}
                        onChange={(e) => handleChange("skills", e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold text-center text-blue-600">
                      Education Details
                    </h2>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="eduDegree">{labelsMap.eduDegree}</Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="eduDegree"
                        type="text"
                        value={formData.eduDegree}
                        onChange={(e) =>
                          handleChange("eduDegree", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="eduUniversity">
                        {labelsMap.eduUniversity}
                      </Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="eduUniversity"
                        type="text"
                        value={formData.eduUniversity}
                        onChange={(e) =>
                          handleChange("eduUniversity", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="eduBranch">{labelsMap.eduBranch}</Label>
                      <Input
                        id="eduBranch"
                        type="text"
                        value={formData.eduBranch}
                        onChange={(e) =>
                          handleChange("eduBranch", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="eduYear">{labelsMap.eduYear}</Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="eduYear"
                        type="number"
                        min="1900"
                        max="2100"
                        step="1"
                        value={formData.eduYear}
                        onChange={(e) =>
                          handleChange("eduYear", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="eduGrade">{labelsMap.eduGrade}</Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="eduGrade"
                        type="number"
                        step="0.01"
                        value={formData.eduGrade ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "eduGrade",
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  </div>
                )}
                {step === 4 && (
                  <>
                    <h2 className="text-xl font-semibold text-center text-blue-600">
                      Emergency Contact Details
                    </h2>
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor="emergencyName">
                        {labelsMap.emergencyName}
                      </Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="emergencyName"
                        type="text"
                        value={formData.emergencyName}
                        onChange={(e) =>
                          handleChange("emergencyName", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor="emergencyRelationship">
                        {labelsMap.emergencyRelationship}
                      </Label>
                      <Select
                        value={formData.emergencyRelationship}
                        onValueChange={(val) =>
                          handleChange("emergencyRelationship", val)
                        }
                      >
                        <SelectTrigger
                          id="emergencyRelationship"
                          className="w-full"
                        >
                          <SelectValue placeholder="Select Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                            <SelectItem value="Parent">Parent</SelectItem>
                            <SelectItem value="Sibling">Sibling</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                      <Label htmlFor="emergencyNumber">
                        {labelsMap.emergencyNumber}
                      </Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="emergencyNumber"
                        type="tel"
                        inputMode="numeric"
                        value={formData.emergencyNumber ?? ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 10) {
                            setFormData((prev) => ({
                              ...prev,
                              emergencyNumber:
                                value === "" ? null : Number(value),
                            }));
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="emergencyAddress">
                        {labelsMap.emergencyAddress}
                      </Label>
                      <Input
                        className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                        id="emergencyAddress"
                        type="text"
                        value={formData.emergencyAddress}
                        onChange={(e) =>
                          handleChange("emergencyAddress", e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row justify-between gap-2 mt-2">
                <Button
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={step === 1}
                >
                  Previous
                </Button>
                {step < 4 ? (
                  <Button
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                    type="button"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
                    type="submit"
                  >
                    Save User
                  </Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader></DialogHeader>
            {selectedEmployeeId && (
              <EmployeePreview userId={selectedEmployeeId} />
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={photoModalOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen && stream) {
              stream.getTracks().forEach((track) => track.stop());
              setStream(null);
            }
            setPhotoModalOpen(isOpen);
          }}
        >
          <DialogContent className="max-w-md w-[90vw] p-4 bg-white rounded-xl shadow-xl">
            <h2 className="text-lg font-semibold mb-2">
              Capture Profile Photo
            </h2>
            <CameraCapture
              onCapture={(base64, file) => {
                setPhotoPreview(URL.createObjectURL(file));
                setSelectedPhotoFile(file);
                setPhotoModalOpen(false);
              }}
              onCancel={() => setPhotoModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
}
