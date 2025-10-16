"use client"

import { Button } from "@/components/ui/button"
import { Loader2, Power, CircleUser, KeyRound, Logs, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { EmployeeProfile } from "./employee-profile-edit"
import { ProfilePhoto } from "./ViewProfilePhoto"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import Input from "@mui/material/Input"
import { Ratio } from "lucide-react"
import { toast } from "react-toastify"
import RouteLoader from "./loader"
import "react-toastify/dist/ReactToastify.css"

export function Navigation() {
  const [user, setUser] = useState<{ userId: number; name: string; employeeId: string; role: string } | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const router = useRouter()

  const [openProfile, setOpenProfile] = useState(false)
  const [openChangePassword, setOpenChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [openProfilePhoto, setOpenProfilePhoto] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken")
    const role = sessionStorage.getItem("role")
    const name = sessionStorage.getItem("name")
    const employeeId = sessionStorage.getItem("empId")
    const userId = sessionStorage.getItem("id")

    if (token) {
      setUser({
        userId: userId ? Number(userId) : 1,
        name: name || "",
        employeeId: employeeId || "",
        role: role || "",
      })
    } else {
      router.push("/")
    }
  }, [router])

  const handleResetPassword = async () => {
    if (!oldPassword) return toast.warning("Enter your current password!")
    if (!newPassword) return toast.warning("Enter a new password!")
    if (newPassword.length < 7) return toast.warning("New password must be at least 7 characters.")
    if (newPassword !== confirmPassword) return toast.warning("Passwords do not match ❌")

    setLoading(true)
    try {
      const token = sessionStorage.getItem("accessToken")
      const response = await fetch(`${apiBaseUrl}api/employee/resetPassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?.userId, oldPassword, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast.success("Password updated successfully!")
        setTimeout(() => setOpenChangePassword(false), 1500)
      } else {
        toast.error(data.message || "Failed to change password ❌")
      }
    } catch {
      toast.error("Error occurred while changing password ❌")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    sessionStorage.clear()
    setIsLoggingOut(false)
    router.push("/post-logout")    
  }

  return (
    <>
      <RouteLoader loading={isLoggingOut} message="Logging Out..." />
      <RouteLoader loading={loading} message="Updating password..." />

      <nav className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="container mx-auto px-4">
           <div className="flex items-center justify-between h-16 relative">
             {/* Left side: Logo */}
             <div className="flex items-center space-x-2">
               <Ratio className="h-7 w-7 text-primary" />
               <span className="hidden sm:inline text-gray-500 text-lg">HR Portal</span>
             </div>

             {/* Center welcome text */}
             <div className="hidden sm:block absolute left-1/2 transform -translate-x-1/2">
               <span className="text-lg font-medium">
                 Welcome, <b>{user?.name}</b> ({user?.employeeId})
               </span>
             </div>

             {/* Right side: Desktop buttons */}
           <div className="hidden sm:flex items-center space-x-2">
            {user?.role !== "hr_admin" && (
                <Dialog open={openProfilePhoto} onOpenChange={setOpenProfilePhoto}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative inline-flex items-center group mr-2"
                    >
                      {/* You can use any icon you like */}
                      {user && (
                        <ProfilePhoto
                          userId={user.userId}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2
                                        bg-gray-200 text-black text-xs rounded px-2 py-1
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        View Profile
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl p-0 rounded-2xl shadow-lg flex flex-col items-center">
                    {user && <EmployeeProfile userId={user.userId} />}
                  </DialogContent>
                </Dialog>
              )}

              <Dialog open={openChangePassword} onOpenChange={setOpenChangePassword}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setOpenChangePassword(true)}
                    variant="ghost"
                    size="sm"
                    className="relative inline-flex items-center group"
                  >
                    <KeyRound className="!h-5 !w-5" />
                    <span className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2
                                      bg-gray-200 text-black text-xs rounded px-2 py-1
                                      opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      Change Password
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md w-full p-8 rounded-2xl shadow-2xl bg-white dark:bg-gray-800 flex flex-col gap-6">
                  <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
                      Change Password
                    </DialogTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Update your account password securely!
                    </p>
                  </DialogHeader>

                  <div className="flex flex-col gap-4">
                    <Input
                      type="password"
                      placeholder="Current Password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <Input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <Input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <Button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                    Update Password
                  </Button>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="relative inline-flex items-center group"
              >
                <Power className="!h-5 !w-5" />
                <span className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2
                                  bg-gray-200 text-black text-xs rounded px-2 py-1
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  Sign Out
                </span>
              </Button>
            </div>
            {/* Mobile Hamburger */}
            <div className="sm:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenu(!mobileMenu)}>
                {mobileMenu ? <X className="h-6 w-6" /> : <Logs className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenu && (
            <div className="sm:hidden mt-2 flex flex-col space-y-2 bg-background p-3 rounded-lg shadow-md text-center">
              <span className="text-sm font-medium text-gray-700">
                Hi, <b>{user?.name}</b> ({user?.employeeId})
              </span>
              <div className="flex flex-col items-start space-y-2">
                {user?.role !== "hr_admin" && (
                  <Dialog open={openProfile} onOpenChange={setOpenProfile}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <CircleUser className="mr-2 h-4 w-4" /> Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl p-0 rounded-2xl shadow-lg flex flex-col items-center">
                      {user && <EmployeeProfile userId={user.userId} />}
                    </DialogContent>
                  </Dialog>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setOpenChangePassword(true)}
                >
                  <KeyRound className="mr-2 h-4 w-4" /> Modify Password
                </Button>

                <Button variant="outline" className="w-full" size="sm" onClick={handleLogout}>
                  <Power className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
