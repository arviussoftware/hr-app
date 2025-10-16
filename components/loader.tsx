"use client"

interface RouteLoaderProps {
  loading: boolean
  message?: string
}

export default function RouteLoader({ loading, message }: RouteLoaderProps) {
  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 bg-opacity-95 backdrop-blur-sm transition-all">
      <div className="flex flex-col items-center space-y-6">
        {/* Dual Spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-[5px] border-blue-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full border-[3px] border-purple-500 border-b-transparent animate-[spin_5000ms_linear_infinite]"></div>
        </div>

        {/* Text animation */}
        <div className="text-center">
          <p className="text-xl font-semibold text-blue-700 animate-pulse tracking-widest">
            {message || "Loading..."}
          </p>
          <p className="text-sm text-gray-500 mt-1 animate-fade-in">
            Please wait a moment
          </p>
        </div>  
      </div>
    </div>
  )
}
