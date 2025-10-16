"use client"
 
import { useState } from "react"
import { PolicyTimeline } from "@/components/policy-timeline"
import { PolicyUpload } from "@/components/policy-upload"
import type { PolicyEntry } from "@/lib/policy-data"
 
export function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handlePolicyAdded = (policy: PolicyEntry) => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="bg-background">
      <main className="container mx-auto px-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <PolicyTimeline refreshTrigger={refreshTrigger} />
          </div>
          <div className="lg:col-span-1">
            <PolicyUpload onPolicyAdded={handlePolicyAdded} />
          </div>
        </div>
      </main>
    </div>
  )
}
 
 