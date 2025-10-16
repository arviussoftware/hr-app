"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { toast } from "react-toastify";

export interface EventData {
  project: string;
  type: string;
  date: string;
  from: string;
  to: string;
  task: string;
}

interface EventFormProps {
  selectedDate: Date;
  onSubmit: (eventData: EventData) => void;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ selectedDate, onSubmit, onClose }) => {
  const [project, setProject] = useState<string>("");
  const [type, setType] = useState<string>("Development");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [task, setTask] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !from || !to) {
      toast.warning("Please fill all fields");
      return;
    }

    const eventData: EventData = {
      project,
      type,
      date: format(selectedDate, "yyyy-MM-dd"),
      from,
      to,
      task,
    };

    onSubmit(eventData);
    onClose();
    setProject("");
    setFrom("");
    setTo("");
    setTask("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-96 md:w-[400px] animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Add Timesheet</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Project</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Activity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Activity</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            >
              <option value="Development">Development</option>
              <option value="Testing">Testing</option>
              <option value="Deployment">Deployment</option>
              <option value="Meeting">Meeting</option>
              <option value="Training">Training</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              readOnly
              className="w-full px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed shadow-sm"
            />
          </div>

          {/* From / To */}
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">From</label>
              <input
                type="time"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">To</label>
              <input
                type="time"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
          </div>

          {/* Task */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Task </label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Describe the task"
              rows={3}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              Add Timesheet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
