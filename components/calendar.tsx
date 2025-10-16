"use client";

import { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
} from "date-fns";
import EventForm from "@/components/time-sheets";
import { toast } from "react-toastify";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Holiday {
  date: string;
  name: string;
}

interface Event {
  id?: number;
  project: string;
  type: string;
  date: string;
  from: string;
  to: string;
  task: string;
}

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayName, setHolidayName] = useState<string>("");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch userId from sessionStorage
  useEffect(() => {
    const storedUserId = sessionStorage.getItem("id");
    if (storedUserId) setUserId(parseInt(storedUserId));
  }, []);

  // Fetch holidays
  useEffect(() => {
    fetch(`${apiBaseUrl}api/hr/getHolidays`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.rows) {
          setHolidays(
            data.rows
              .filter((h: any) => h.holidayType === true)
              .map((h: any) => ({
                date: h.holidayDate,
                name: h.holidayName,
              }))
          );
        }
      })
      .catch((err) => console.error("Error fetching holidays:", err));
  }, []);

  // Fetch timesheets
  const fetchTimesheets = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${apiBaseUrl}api/employee/timesheets/${userId}`);
      const data = await res.json();
      if (data?.rows) {
        const formatted = data.rows.map((r: any) => ({
          id: r.id,
          project: r.projectName,
          type: r.activity,
          date: r.colDate,
          from: r.startTime,
          to: r.endTime,
          task: r.task,
        }));
        setEvents(formatted);
        if (selectedDate) {
          const dayEvents = formatted.filter((ev: Event) =>
            isSameDay(parseISO(ev.date), selectedDate)
          );
          setSelectedDayEvents(dayEvents);
        }
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [userId]);

  // Add timesheet
  const handleEventSubmit = async (eventData: Event) => {
    if (!userId) return toast.warning("User not logged in!");
    setShowForm(false);

    try {
      const formatTimeForBackend = (time: string) =>
        time.length === 5 ? time + ":00" : time;

      const payload = {
        Project: eventData.project,
        Activity: eventData.type,
        Date: eventData.date,
        StartTime: formatTimeForBackend(eventData.from),
        EndTime: formatTimeForBackend(eventData.to),
        Task: eventData.task,
        UserId: userId,
      };

      const res = await fetch(
        `${apiBaseUrl}api/employee/${userId}/addTimesheet`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();
      if (res.ok) {
        toast.success("Timesheet added successfully!");
        await fetchTimesheets();
        if (selectedDate && isSameDay(parseISO(eventData.date), selectedDate)) {
          setSelectedDayEvents((prev) => [
            ...prev,
            {
              project: eventData.project,
              type: eventData.type,
              date: eventData.date,
              from: eventData.from,
              to: eventData.to,
              task: eventData.task,
            },
          ]);
        }
        setShowViewModal(true);
      } else {
        toast.error("Failed: " + (result.details || result.message));
      }
    } catch (error) {
      toast.error("Error adding timesheet: " + error);
    }
  };

  const handleDateClick = (day: Date) => {
    const dayEvents = events.filter((ev) => isSameDay(parseISO(ev.date), day));
    setSelectedDate(day);
    setSelectedDayEvents(dayEvents);

    const holiday = holidays.find((h) => isSameDay(parseISO(h.date), day));
    setHolidayName(holiday ? holiday.name : "");

    setShowActionModal(true);
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const currentDay = day;
        const holiday = holidays.find((h) =>
          isSameDay(parseISO(h.date), currentDay)
        );
        const dayEvents = events.filter((ev) =>
          isSameDay(parseISO(ev.date), currentDay)
        );

        days.push(
          <div
            key={currentDay.toISOString()}
            className={`
              flex flex-col items-center justify-center p-1 sm:p-2 min-w-[36px] sm:min-w-[40px] text-xs sm:text-sm border rounded-lg
              cursor-pointer transition-all duration-150 ease-in-out
              ${
                !isSameMonth(currentDay, monthStart)
                  ? "text-gray-300"
                  : "text-gray-800 hover:bg-gray-100"
              }
              ${holiday ? "border-red-500 border-2 bg-red-50" : ""}
              ${
                isSameDay(currentDay, selectedDate || new Date())
                  ? "border-blue-600 border-2 font-bold bg-blue-50"
                  : ""
              }
            `}
            onClick={() => handleDateClick(currentDay)}
          >
            <span>{currentDay.getDate()}</span>
            {dayEvents.length > 0 && (
              <span className="mt-0.5 text-[10px] sm:text-xs text-green-600 font-medium">
                {dayEvents.length}
              </span>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div
          className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-0.5 sm:mb-2"
          key={days[0].key}
        >
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <div className="max-w-full sm:max-w-6xl mx-auto p-2 sm:p-6 border rounded-xl shadow-lg bg-white transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          className="px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          {"<"}
        </button>
        <div className="text-xl sm:text-2xl font-bold text-gray-800">
          {format(currentMonth, "MMMM yyyy")}
        </div>
        <button
          className="px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          {">"}
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 text-center text-gray-500 font-semibold text-xs sm:text-sm mb-2 sm:mb-3">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="uppercase tracking-wide">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1 sm:gap-2 min-w-max">
          {renderCells()}
        </div>
      </div>

      {/* Holiday Info */}
      {holidayName && (
        <div className="mt-2 sm:mt-4 p-2 sm:p-3 rounded bg-yellow-100 border-l-4 border-yellow-500 text-sm sm:text-base">
          <strong className="text-yellow-800">🎉 Company Holiday:</strong>{" "}
          {holidayName}
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-3 sm:p-5 text-center space-y-2 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">
              {format(selectedDate, "dd MMM yyyy")}
            </h3>
            <button
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
              onClick={() => {
                setShowActionModal(false);
                setShowForm(true);
              }}
            >
              ➕ Add Timesheet
            </button>
            <button
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
              onClick={() => {
                setShowActionModal(false);
                setShowViewModal(true);
              }}
            >
              👁️ View Timesheet
            </button>
            <button
              className="w-full bg-gray-400 text-white py-2 rounded-md hover:bg-gray-500 transition"
              onClick={() => setShowActionModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Timesheet Modal */}
      {showForm && selectedDate && (
        <EventForm
          selectedDate={selectedDate}
          onSubmit={handleEventSubmit}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* View Timesheet Modal */}
      {showViewModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 px-4">
          <div className="bg-white p-3 sm:p-5 rounded-xl shadow-xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4 text-center">
              Timesheets on {format(selectedDate, "dd MMM yyyy")}
            </h2>

            {selectedDayEvents.length > 0 ? (
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base max-h-60 overflow-y-auto">
                {selectedDayEvents.map((ev, index) => (
                  <li
                    key={index}
                    className="border border-gray-200 p-2 sm:p-3 rounded-lg bg-gray-50"
                  >
                    <p className="font-semibold">
                      {ev.project} ({ev.type})
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      {ev.from} - {ev.to}
                    </p>
                    <p className="text-gray-700 mt-1 text-[10px] sm:text-sm">
                      {ev.task}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 text-xs sm:text-sm">
                No timesheets added.
              </p>
            )}

            <button
              className="mt-3 sm:mt-6 w-full bg-gray-400 text-white py-2 rounded hover:bg-gray-500 transition"
              onClick={() => setShowViewModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
