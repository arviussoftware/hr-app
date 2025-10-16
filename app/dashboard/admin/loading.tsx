// app/dashboard/admin/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="ml-4 text-blue-700 font-semibold text-lg animate-pulse">
        Loading Dashboard...
      </p>
    </div>
  );
}
