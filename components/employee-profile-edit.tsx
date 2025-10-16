"use client";

import { useEffect, useState } from "react";
import RouteLoader from "./loader";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ProfilePhoto } from "./ViewProfilePhoto";
import CameraCapture from "./CameraCapture";
import UploadPhoto from "./UploadPhoto";
import toast, { Toaster } from 'react-hot-toast';
import { Camera } from "lucide-react";

type EmployeeProfileType = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: number;
  gender?: string;
  dateOfBirth?: string;
  addressPermanent?: string;
  addressPresent?: string;
  employeeId?: string;
  hireDate?: string;
  department?: string;
  role?: string;
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
  emergencyContactNumber?: number;
  emergencyContactRelationship?: string;
  emergencyContactEmail?: string;
  emergencyContactAddress?: string;
};

export function EmployeeProfile({ userId }: { userId: number }) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [data, setData] = useState<EmployeeProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openUploadPhoto, setOpenUploadPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(`${apiBaseUrl}api/employee/${userId}/photo`);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Fetch user profile
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${apiBaseUrl}api/hr/userPreview/${userId}`);
        if (!res.ok) throw new Error(`Failed with status ${res.status}`);
        const result: EmployeeProfileType = await res.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleUpload = async (base64: string) => {
    try {
      const base64String = base64.split(",")[1];
      const res = await fetch(`${apiBaseUrl}api/employee/${userId}/uploadPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: `profile_${Date.now()}.jpg`, base64Image: base64String }),
      });

      if (!res.ok) throw new Error("Failed to upload photo");

      // Force refresh the profile photo with cache-buster
      setPhotoUrl(`${apiBaseUrl}api/employee/${userId}/photo?ts=${Date.now()}`);
      setPhotoPreview(null);
      setShowCamera(false);
      setOpenUploadPhoto(false);

      toast.success("Profile Photo updated successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to update Profile Photo");
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <RouteLoader loading={true} message="Loading your profile..." />
      </div>
    );
  }

  if (error)
    return <p className="text-red-500 text-center font-medium mt-4">Error: {error}</p>;

  if (!data)
    return <p className="text-gray-600 text-center mt-4">No employee found.</p>;

  const renderField = (label: string, value: any, field?: keyof EmployeeProfileType) => {
    let displayValue = value;
    if (field === "dateOfBirth" || field === "hireDate")
      displayValue = value ? new Date(value).toLocaleDateString() : "N/A";
    if (field === "eduYear")
      displayValue = value ? new Date(value).getFullYear() : "N/A";

    return (
      <div
        key={label}
        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full"
      >
        <p className="font-medium text-gray-600 w-full sm:w-56">{label}:</p>
        <p className="text-gray-800 break-words">{displayValue ?? "N/A"}</p>
      </div>
    );
  };

  // --- Fields ---
  const page1Fields: [string, keyof EmployeeProfileType][] = [
    ["Date of Joining", "hireDate"],
    ["Email", "email"],
    ["Contact Number", "contactNumber"],
    ["Work Location", "location"],
    ["Manager", "managerName"],
  ];

  const page2Fields: [string, keyof EmployeeProfileType][] = [
    ["Skills", "skills"],
    ["Date Of Birth", "dateOfBirth"],
    ["Present Address", "addressPresent"],
    ["Permanent Address", "addressPermanent"],
  ];

  const page3Fields: [string, keyof EmployeeProfileType][] = [
    ["Education Degree", "eduDegree"],
    ["Branch", "eduBranch"],
    ["University", "eduUniversity"],
    ["Grade", "eduGrade"],
    ["Year", "eduYear"],
  ];

  const page4Fields: [string, keyof EmployeeProfileType][] = [
    ["Contact Name", "emergencyContactName"],
    ["Relationship with the user", "emergencyContactRelationship"],
    ["Contact Number", "emergencyContactNumber"],
    ["Emergency Contact Address", "emergencyContactAddress"],
  ];

  // const renderPage = () => {
  //   if (page === 1) return page1Fields.map(([label, field]) => renderField(label, data[field], field));
  //   if (page === 2) return page2Fields.map(([label, field]) => renderField(label, data[field], field));
  //   if (page === 3) return page3Fields.map(([label, field]) => renderField(label, data[field], field));
  //   if (page === 4) {
  //     return [
  //       <h3 key="emergency-title" className="text-lg font-semibold mb-3 text-gray-700 underline">
  //         Emergency Contact Details:
  //       </h3>,
  //       ...page4Fields.map(([label, field]) => renderField(label, data[field], field)),
  //     ];
  //   }
  //   return [];
  // };

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #3b82f6, #6366f1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #2563eb, #4f46e5);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3b82f6 #f1f1f1;
        }
        [data-state="open"] .dialog-close {
          top: 0.75rem !important;
          right: 0.75rem !important;
        }
      `}</style>

      <Toaster position="top-right" reverseOrder={false} />
      <RouteLoader loading={loading} message="Loading your profile.." />
        <div className="custom-scrollbar !selected !disabled overflow-y-auto max-h-[90vh] p-4 pr-7 w-full max-w-4xl mx-auto bg-gradient-to-br from-white via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-xl p-8">
          {/* --- Profile Header --- */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-12 mb-5 border-b pb-8">
            <Dialog open={openUploadPhoto} onOpenChange={setOpenUploadPhoto}>
              <DialogTrigger asChild>
                <button type="button" className="relative group">
                  <ProfilePhoto
                    key={photoUrl}
                    userId={userId}
                    src={photoUrl}
                    className="w-36 h-36 rounded-full border-4 border-blue-500 shadow-lg object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  />
                </button>
              </DialogTrigger>

              <DialogContent className="max-w-lg p-6 pt-10 rounded-xl shadow-lg">
                <div className="flex flex-col gap-6">

                  {/* Device Upload */}
                  <div className="flex flex-col items-center gap-2">
                    
                    <UploadPhoto
                      userId={userId}
                      onUploadSuccess={(newUrl) => {
                        setPhotoUrl(`${newUrl}?ts=${Date.now()}`);
                        setPhotoPreview(null);
                        setOpenUploadPhoto(false);
                      }}
                    />
                  </div>

                  {/* Camera Capture */}
                  <div className="flex flex-col items-center gap-2">
                    {!showCamera ? (
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 relative group"
                      >
                        <Camera className="w-6 h-6" />
                        <span className="sr-only">Open Camera</span>
                        <span className="absolute -top-8 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                          Open Camera
                        </span>
                      </button>
                    ) : (
                      <CameraCapture
                        onCapture={(base64, file) => setPhotoPreview(base64)}
                        onCancel={() => setShowCamera(false)}
                      />
                    )}
                  </div>

                  {/* Preview & Confirm */}
                  {photoPreview && (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-gray-600">Preview:</p>
                      <img
                        src={photoPreview}
                        alt="Profile Preview"
                        className="w-24 h-24 object-cover rounded-full border"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpload(photoPreview)}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Name + Employee ID */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {data.firstName} {data.lastName}
              </h2>
              <p className="mt-2 text-lg text-blue-600 dark:text-blue-400 font-medium">
                Employee ID: {data.employeeId ?? "N/A"}
              </p>
            </div>
          </div>

          {/* --- Information Sections --- */}
          <div className="flex flex-col gap-8">
            <Section title="Work Information" color="blue" fields={page1Fields.map(([label, field]) => renderField(label, data[field], field))} />
            <Section title="Personal Information" color="green" fields={page2Fields.map(([label, field]) => renderField(label, data[field], field))} />
            <Section title="Education" color="purple" fields={page3Fields.map(([label, field]) => renderField(label, data[field], field))} />
            <Section title="Emergency Contact" color="red" fields={page4Fields.map(([label, field]) => renderField(label, data[field], field))} />
          </div>
        </div>
    </>
  );
}

// Section Component
const Section = ({ title, color, fields }: { title: string; color: string; fields: React.ReactNode[] }) => (
  <div className={`w-full border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-white dark:bg-gray-800 shadow hover:shadow-lg transition`}>
    <h3 className={`text-xl font-semibold mb-6 text-${color}-700 dark:text-${color}-400`}>{title}</h3>
    <div className="space-y-4">{fields}</div>
  </div>
);
