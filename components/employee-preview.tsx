"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  UserIcon,
  UserCheck,
  UserX,
  Edit,
  Save,
  ClipboardX,
} from "lucide-react";
import RouteLoader from "./loader";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

type EmployeePreviewType = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: number | string;
  gender?: string;
  bloodGroup: string;
  dateOfBirth?: string;
  addressPermanent?: string;
  addressPresent?: string;
  employeeId?: string;
  hireDate?: string;
  department?: string;
  role: string;
  managerId?: number;
  managerName?: string;
  location?: string;
  skills?: string;
  eduDegree?: string;
  eduBranch?: string;
  eduUniversity?: string;
  eduGrade?: number;
  eduYear?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: number | string;
  emergencyContactRelationship?: string;
  emergencyContactAddress?: string;
  isActive?: boolean;
  profilePhoto?: string;
};

export function EmployeePreview({ userId }: { userId: number }) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [data, setData] = useState<EmployeePreviewType | null>(null);
  const [originalData, setOriginalData] = useState<EmployeePreviewType | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const formatProfilePhoto = (user: EmployeePreviewType) => {
    if (user.profilePhoto) {
      return {
        ...user,
        profilePhoto: `data:image/png;base64,${user.profilePhoto}`,
      };
    }
    return user;
  };

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${apiBaseUrl}api/hr/userPreview/${userId}`);
        if (!res.ok) throw new Error(`Failed with status ${res.status}`);
        const result: EmployeePreviewType = await res.json();

        const formattedResult = formatProfilePhoto(result);
        setData(formattedResult);
        setOriginalData(formattedResult);

        const mgrRes = await fetch(`${apiBaseUrl}api/hr/managerList`);
        if (!mgrRes.ok) throw new Error("Failed to fetch managers");
        const mgrData = await mgrRes.json();
        setManagers(mgrData.rows);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleChange = (field: keyof EmployeePreviewType, value: any) => {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleDiscard = () => {
    setData(originalData);
    setEditMode(false);
    setValidationError(null);
  };

  const validateFields = () => {
    if (!data) return false;
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setValidationError("Invalid email address.");
      return false;
    }
    if (data.contactNumber && !/^\d{10}$/.test(String(data.contactNumber))) {
      setValidationError("Primary contact number must be exactly 10 digits.");
      return false;
    }
    if (data.eduYear && !/^\d{4}$/.test(data.eduYear)) {
      setValidationError("Education year must be a valid 4-digit year.");
      return false;
    }
    if (
      data.emergencyContactNumber &&
      !/^\d{10}$/.test(String(data.emergencyContactNumber))
    ) {
      setValidationError("Emergency contact number must be exactly 10 digits.");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSave = async () => {
    if (!data || !validateFields()) return;

    try {
      setSaving(true);

      // Filter and format before sending to backend
      const dataToSend = {
        userId: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role?.toLowerCase() || null, // ✅ lowercase for DB constraint
        department: data.department,
        location: data.location,
        managerId: data.managerId,
        hireDate: data.hireDate
          ? new Date(data.hireDate).toISOString().split("T")[0]
          : null, // ✅ DATE only
        isActive: data.isActive,
        skills: data.skills,
        eduDegree: data.eduDegree,
        eduBranch: data.eduBranch,
        eduUniversity: data.eduUniversity,
        eduYear: data.eduYear,
        eduGrade: data.eduGrade,
        contactNumber: data.contactNumber,
        addressPermanent: data.addressPermanent,
        addressPresent: data.addressPresent,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNumber: data.emergencyContactNumber,
        emergencyContactRelationship: data.emergencyContactRelationship,
        emergencyContactAddress: data.emergencyContactAddress,
      };

      const res = await fetch(`${apiBaseUrl}api/hr/updateUser/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) throw new Error(`Save failed with status ${res.status}`);

      const refreshed: EmployeePreviewType = await fetch(
        `${apiBaseUrl}api/hr/userPreview/${userId}`
      ).then((r) => r.json());
      const formattedRefreshed = formatProfilePhoto(refreshed);
      setData(formattedRefreshed);
      setOriginalData(formattedRefreshed);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!data) return;
    setToggling(true);

    try {
      const res = await fetch(`${apiBaseUrl}api/hr/markStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.id,
          action: !data.isActive,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setData({ ...data, isActive: !data.isActive });
      setOriginalData({ ...data, isActive: !data.isActive });
      setConfirmOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <RouteLoader loading={true} message="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">Error: {error}</p>;
  }
  if (!data) {
    return <p className="text-gray-600 text-center">No employee found.</p>;
  }

  // Field rendering
  const renderField = (
    label: string,
    field: keyof EmployeePreviewType,
    value: any
  ) => {
    const isDate = ["dateOfBirth", "hireDate"].includes(field);
    const isReadOnly = ["hireDate", "dateOfBirth", "bloodGroup"].includes(
      field
    );
    const displayValue =
      isDate && value ? new Date(value).toLocaleDateString() : value ?? "N/A";

    if (!editMode || isReadOnly) {
      if (field === "managerId") {
        const managerDisplay =
          managers.find((mgr) => mgr.id === value)?.name || "N/A";
        return (
          <div key={field} className="flex justify-between border-b pb-2">
            <span className="font-medium text-gray-600">{label}</span>
            <span className="text-gray-800">{managerDisplay}</span>
          </div>
        );
      }
      return (
        <div key={field} className="flex justify-between border-b pb-2">
          <span className="font-medium text-gray-600">{label}</span>
          <span className="text-gray-800">{displayValue}</span>
        </div>
      );
    }

    // Edit mode dropdowns
    if (field === "role") {
      return (
        <div key={field} className="flex flex-col gap-1">
          <label className="font-medium text-gray-600">{label}</label>
          <select
            className="w-full border rounded-md px-2 py-1 text-sm sm:text-base"
            value={data.role ?? ""}
            onChange={(e) => handleChange("role", e.target.value)}
          >
            <option value="">Select Role</option>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      );
    }

    if (field === "department") {
      return (
        <div key={field} className="flex flex-col gap-1">
          <label className="font-medium text-gray-600">{label}</label>
          <select
            className="w-full border rounded-md px-2 py-1 text-sm sm:text-base"
            value={data.department ?? ""}
            onChange={(e) => handleChange("department", e.target.value)}
          >
            <option value="">Select Department</option>
            <option value="Engineering">Engineering</option>
            <option value="Managerial">Managerial</option>
          </select>
        </div>
      );
    }

    if (field === "location") {
      return (
        <div key={field} className="flex flex-col gap-1">
          <label className="font-medium text-gray-600">{label}</label>
          <select
            className="w-full border rounded-md px-2 py-1 text-sm sm:text-base"
            value={data.location ?? ""}
            onChange={(e) => handleChange("location", e.target.value)}
          >
            <option value="">Select Location</option>
            <option value="In Office">In Office</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      );
    }

    if (field === "gender") {
      return (
        <div key={field} className="flex flex-col gap-1">
          <label className="font-medium text-gray-600">{label}</label>
          <select
            className="w-full border rounded-md px-2 py-1 text-sm sm:text-base"
            value={data.gender ?? ""}
            onChange={(e) => handleChange("gender", e.target.value)}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      );
    }

    if (field === "managerId") {
      return (
        <div key={field} className="flex flex-col gap-1">
          <label className="font-medium text-gray-600">{label}</label>
          <select
            className="w-full border rounded-md px-2 py-1 text-sm sm:text-base"
            value={data.managerId ?? ""}
            onChange={(e) => handleChange("managerId", Number(e.target.value))}
          >
            <option value="">Select Manager</option>
            {managers.map((mgr) => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field === "eduYear") {
      return (
        <div key={field} className="flex flex-col gap-1">
          <label className="font-medium text-gray-600">{label}</label>
          <Input
            type="text"
            className="text-sm sm:text-base"
            value={value ?? ""}
            onChange={(e) => handleChange("eduYear", e.target.value)}
            placeholder="YYYY"
            maxLength={4}
          />
        </div>
      );
    }

    return (
      <div key={field} className="flex flex-col gap-1">
        <label className="font-medium text-gray-600">{label}</label>
        <Input
          className="text-sm sm:text-base"
          type={field.includes("Number") ? "tel" : "text"}
          value={value ?? ""}
          onChange={(e) => handleChange(field, e.target.value)}
        />
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        /* Scrollbar for WebKit browsers */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .animate-fadeIn {
          animation: fadeInScale 0.25s ease-out forwards;
        }

        .card-glow {
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.95),
            rgba(245, 245, 245, 0.95)
          );
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }
        .dark .card-glow {
          background: linear-gradient(
            145deg,
            rgba(30, 41, 59, 0.95),
            rgba(15, 23, 42, 0.95)
          );
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
        }
        .card-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        h3.section-title {
          position: relative;
          display: inline-block;
          font-weight: 700;
        }
        h3.section-title::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -4px;
          width: 50%;
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(to right, #2563eb, #3b82f6);
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-in-out both;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #4ade80; /* green thumb */
          border-radius: 4px;
          border: 2px solid #f1f1f1; /* space around thumb */
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #16a34a; /* darker green on hover */
        }

        /* Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4ade80 #f1f1f1;
        }

        @media (max-width: 640px) {
          body,
          html {
            overflow-x: hidden;
          }
          .card-glow {
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
      <RouteLoader loading={loading} message={"Loading Preview.."} />
      <div className="w-full flex justify-center px-2 sm:px-4 overflow-x-hidden">
        <div className="w-full max-w-5xl card-glow rounded-3xl p-4 sm:p-6 md:p-8 shadow-lg relative overflow-hidden">
          {/* Profile section */}
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 sm:gap-6 mb-6 w-full">
            {/* Profile Photo */}
            <div className="flex-shrink-0 flex items-center">
              {data.profilePhoto ? (
                <img
                  src={data.profilePhoto}
                  className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-blue-500 sm:shadow-md"
                />
              ) : (
                <UserIcon className="w-20 h-20 sm:w-32 sm:h-32 text-gray-400 dark:text-gray-500" />
              )}
            </div>

            {/* Name + Status */}
            <div className="flex flex-col items-center sm:items-start justify-center text-center sm:text-left flex-1 min-w-[140px]">
              <div>
                <h2 className="text-lg sm:text-3xl font-bold text-gray-800 dark:text-gray-100 leading-snug">
                  {data.firstName} {data.lastName}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
                  Employee ID: {data.employeeId ?? "N/A"}
                </p>
              </div>
              <span
                className={`mt-2 px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full ${
                  data.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                    : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                }`}
              >
                {data.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Buttons Area */}
            <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 items-center justify-end w-auto">
              <TooltipProvider delayDuration={100}>
                {!editMode ? (
                  <>
                    {/* Activate / Deactivate Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium shadow ${
                            data.isActive
                              ? "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
                              : "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white"
                          }`}
                          onClick={() => setConfirmOpen(true)}
                          disabled={toggling}
                        >
                          {toggling ? (
                            <Loader2 className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                          ) : data.isActive ? (
                            <UserX className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>
                          {data.isActive
                            ? "Deactivate Employee"
                            : "Activate Employee"}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Edit Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-gray-800"
                          onClick={() => setEditMode(true)}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Edit Employee Details</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    {/* Discard Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border border-gray-400 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={handleDiscard}
                        >
                          <ClipboardX className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Discard Changes</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* Save Button */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Save Details</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </TooltipProvider>
            </div>
          </div>
          {/* Sections with improved card design */}
          <div className="space-y-8 animate-fadeIn">
            {/** Work Information */}
            <div className="border card-glow rounded-2xl p-6 p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="section-title text-xl text-blue-600 dark:text-blue-400 mb-4">
                Work Information
              </h3>
              {renderField("Email", "email", data.email)}
              {renderField(
                "Role",
                "role",
                data?.role?.charAt(0).toUpperCase() + data.role.slice(1)
              )}
              {renderField("Department", "department", data.department)}
              {renderField("Location", "location", data.location)}
              {renderField("Hire Date", "hireDate", data.hireDate)}
              {renderField("Manager", "managerId", data.managerId)}
            </div>

            {/** Personal Information */}
            <div className="border card-glow rounded-2xl p-6 p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="section-title text-xl text-blue-600 dark:text-blue-400 mb-4">
                Personal Information
              </h3>
              {renderField(
                "Contact Number",
                "contactNumber",
                data.contactNumber
              )}
              {renderField("Gender", "gender", data.gender)}
              {renderField("Blood Group", "bloodGroup", data.bloodGroup)}
              {renderField("Date of Birth", "dateOfBirth", data.dateOfBirth)}
              {renderField(
                "Current Address",
                "addressPresent",
                data.addressPresent
              )}
              {renderField(
                "Permanent Address",
                "addressPermanent",
                data.addressPermanent
              )}
            </div>

            {/** Education */}
            <div className="border card-glow rounded-2xl p-6 p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="section-title text-xl text-blue-600 dark:text-blue-400 mb-4">
                Education
              </h3>
              {renderField("Degree", "eduDegree", data.eduDegree)}
              {renderField("Branch", "eduBranch", data.eduBranch)}
              {renderField("University", "eduUniversity", data.eduUniversity)}
              {renderField("Grade", "eduGrade", data.eduGrade)}
              {renderField("Year of completion", "eduYear", data.eduYear)}
              {renderField("Skills", "skills", data.skills)}
            </div>

            {/** Emergency Contact */}
            <div className="border card-glow rounded-2xl p-6 p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="section-title text-xl text-blue-600 dark:text-blue-400 mb-4">
                Emergency Contact
              </h3>
              {renderField(
                "Name",
                "emergencyContactName",
                data.emergencyContactName
              )}
              {renderField(
                "Relationship",
                "emergencyContactRelationship",
                data.emergencyContactRelationship
              )}
              {renderField(
                "Contact Number",
                "emergencyContactNumber",
                data.emergencyContactNumber
              )}
              {renderField(
                "Address",
                "emergencyContactAddress",
                data.emergencyContactAddress
              )}
            </div>
          </div>
        </div>
        {/* Confirmation Modal */}
        {confirmOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl shadow-2xl w-80 sm:w-96 max-w-full animate-fadeIn scale-95 sm:scale-100 transition-transform duration-300">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {data.isActive
                  ? "Mark Employee as Inactive?"
                  : "Activate Employee?"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                This action will {data.isActive ? "deactivate" : "activate"} the
                employee. Are you sure you want to proceed?
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleToggleActive}
                  disabled={toggling}
                  className={`bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2`}
                >
                  {toggling && <Loader2 className="h-4 w-4 animate-spin" />}
                  {data.isActive ? "Mark Inactive" : "Activate"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
