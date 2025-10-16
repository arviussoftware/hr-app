"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CalendarDays } from "lucide-react"

interface LeaveBalance {
  leave_type_name: string
  leave_type_code: number
  allocated_days: number
  used_days: number
  remaining_days: number
  carried_forward_days: number
}

interface LeaveBalanceCardProps {
  refreshTrigger: number;
}

export function LeaveBalanceCard({ refreshTrigger }: LeaveBalanceCardProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [balances, setBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStorage.id) {
      fetchBalances(sessionStorage.id)
    }
  }, [refreshTrigger]) 

  const fetchBalances = async (userId: string | number) => {
    try {
      const response = await fetch(`${apiUrl}api/employee/leaveBalance/${userId}`)
      const data = await response.json()

      const balancesArray: LeaveBalance[] = [
        {
          leave_type_name: "Restricted Leave",
          leave_type_code: 1,
          allocated_days: data.sickAllocated,
          used_days: data.sickUsed,
          remaining_days: data.sickRemaining,
          carried_forward_days: 0,
        },
        {
          leave_type_name: "Annual Leave",
          leave_type_code: 2,
          allocated_days: data.casualAllocated,
          used_days: data.casualUsed,
          remaining_days: data.casualRemaining,
          carried_forward_days: 0,
        },
        {
          leave_type_name: "Leave Without Pay",
          leave_type_code: 3,
          allocated_days: data.earnedAllocated,
          used_days: data.earnedUsed,
          remaining_days: data.earnedRemaining,
          carried_forward_days: 0,
        }
      ]

      setBalances(balancesArray)
    } catch (error) {
      console.error("Error fetching leave balances:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-gray-100"></div>
        ))}
      </div>
    )
  }

  const gradientColors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-500",
    "from-rose-500 to-pink-500",
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {balances.map((balance, i) => {
        const usagePercentage = (balance.used_days / balance.allocated_days) * 100

        return (
          <Card
            key={balance.leave_type_code}
            className={`relative overflow-hidden border-0 shadow-md rounded-2xl hover:shadow-lg transition-all duration-300 group`}
          >
            {/* Gradient background overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradientColors[i % gradientColors.length]} opacity-80 group-hover:opacity-100 transition-opacity`}
            ></div>

            {/* Foreground content */}
            <div className="relative z-10 p-5 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-2">
                <CardTitle className="text-base font-semibold tracking-wide">
                  {balance.leave_type_name}
                </CardTitle>
                <CalendarDays className="h-5 w-5 opacity-90" />
              </CardHeader>

              <CardContent className="p-0 space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span>Used: {balance.used_days}</span>
                  <span>Remaining: {balance.remaining_days}</span>
                </div>

                <Progress
                  value={usagePercentage}
                  className="h-2 bg-white/30 [&>div]:bg-white transition-all"
                />

                <div className="text-xs text-white/90 mt-1">
                  {balance.allocated_days} days allocated
                  {balance.carried_forward_days > 0 && (
                    <span> (+{balance.carried_forward_days} carried forward)</span>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
