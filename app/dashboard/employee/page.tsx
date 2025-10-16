"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeLeaveApplicationsList } from "@/components/employee-leave-applications";
import { HolidayCalendar } from "@/components/holiday-calendar";
import { PolicyTimeline } from "@/components/policy-timeline";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Listbox } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { IDCard } from "@/components/idCard";

interface UserInfo {
  userId: number;
  name: string;
  employeeId: string;
  role: string;
}

const TABS = [
  { id: "history", name: "Overview" },
  { id: "holiday-calendar", name: "Holidays" },
  { id: "policies", name: "Policies" },
  { id: "id card", name: "ID Card" }
];

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState("history");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const userId = sessionStorage.getItem("id");
    const token = sessionStorage.getItem("accessToken");
    const role = sessionStorage.getItem("role");
    const name = sessionStorage.getItem("name");
    const employeeId = sessionStorage.getItem("empId");

    if (!token) {
      router.push("/login");
    } else {
      setUser({
        userId: userId ? Number(userId) : 1,
        name: name || "",
        employeeId: employeeId || "",
        role: role || "",
      });
    }
  }, [router]);

  return (
    <div className="container mx-auto p-1 pt-0">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        {/* Mobile dropdown */}
        <div className="sm:hidden mb-3">
          <Listbox
            value={TABS.find((tab) => tab.id === activeTab)}
            onChange={(tab: any) => setActiveTab(tab.id)}
          >
            <div className="relative">
              <Listbox.Button className="w-full p-2 border rounded-lg flex justify-between items-center">
                <span>{TABS.find((tab) => tab.id === activeTab)?.name}</span>
                <ChevronDown className="w-5 h-5" />
              </Listbox.Button>
              <Listbox.Options className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto z-50">
                {TABS.map((tab) => (
                  <Listbox.Option key={tab.id} value={tab} as={Fragment}>
                    {({ selected, active }) => (
                      <div
                        className={`cursor-pointer p-2 ${
                          active ? "bg-blue-100 text-blue-900" : "text-gray-900"
                        }`}
                      >
                        {tab.name}
                        {selected && <Check className="w-4 h-4 inline ml-2 text-blue-600" />}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        {/* Desktop Tabs */}
        <TabsList className="hidden sm:flex bg-gray-100 p-1 rounded-xl">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg px-4 py-2"
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="history">
          <EmployeeLeaveApplicationsList
            refreshTrigger={refreshTrigger}
            setRefreshTrigger={setRefreshTrigger}
          />
        </TabsContent>

        <TabsContent value="holiday-calendar">
          <HolidayCalendar />
        </TabsContent>

        <TabsContent value="policies">
          <PolicyTimeline />
        </TabsContent>

        <TabsContent value="id card">
          {user && <IDCard id={user.userId} />}
        </TabsContent>

      </Tabs>
    </div>
  );
}
