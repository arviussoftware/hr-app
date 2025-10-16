"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2, LogIn } from "lucide-react"
import { motion } from "framer-motion"

export default function PostLogout() {
  const router = useRouter()

  const handleGoToLogin = () => {
    router.push("/login")
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute w-72 h-72 bg-blue-300/20 rounded-full blur-3xl top-20 left-10 animate-pulse" />
      <div className="absolute w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl bottom-20 right-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl p-10 max-w-md w-[90%] text-center border border-gray-200 dark:border-gray-700"
      >
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
          You’ve Logged Out Successfully!
        </h1>

        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          Your session has ended safely and securely.
        </p>

        <Button
          onClick={handleGoToLogin}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 mx-auto transition-transform hover:scale-105"
        >
          <LogIn className="h-4 w-4" />
          Go to Login
        </Button>

        {/* Decorative divider */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 text-sm text-gray-500 dark:text-gray-400">
          Secure Logout • © {new Date().getFullYear()}
        </div>
      </motion.div>
    </div>
  )
}
