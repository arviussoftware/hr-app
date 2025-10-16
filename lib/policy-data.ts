// export interface PolicyEntry {
//   id: string
//   title: string
//   type: "pdf" | "text"
//   content?: string
//   fileName?: string
//   pdfData?: string
//   uploadedBy: string
//   uploadedAt: string
//   description: string
//   tags?: string[]
// }

// export interface PolicyData {
//   policies: PolicyEntry[]
//   metadata: {
//     lastUpdated: string
//     version: string
//     totalPolicies: number
//   }
// }

// const STORAGE_KEY = "employee-policies"
// const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

// export function loadPolicies(): PolicyEntry[] {
//   try {
//     const stored = sessionStorage.getItem(STORAGE_KEY)
//     if (stored) {
//       const data: PolicyData = JSON.parse(stored)
//       return data.policies
//     }
//     return []
//   } catch (error) {
//     console.error("Error loading policies from sessionStorage:", error)
//     return []
//   }
// }

// export async function savePolicy(policy: Omit<PolicyEntry, "id">): Promise<PolicyEntry> {
//   const newPolicy: PolicyEntry = {
//     ...policy,
//     id: Date.now().toString(),
//   }

//   try {
//     // Load existing from sessionStorage
//     const existingPolicies = loadPolicies()
//     const updatedPolicies = [...existingPolicies, newPolicy]

//     const dataToStore: PolicyData = {
//       policies: updatedPolicies,
//       metadata: {
//         lastUpdated: new Date().toISOString(),
//         version: "1.0",
//         totalPolicies: updatedPolicies.length,
//       },
//     }

//     // Save locally
//     sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore))
//     console.log("Policy saved to sessionStorage:", newPolicy)

//     //forwarding to the backend
//     const response = await fetch(`${baseUrl}api/addPolicy`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(newPolicy), 
//     })

//     if (!response.ok) {
//       throw new Error(`Failed to save policy to backend: ${response.statusText}`)
//     }

//     console.log("Policy saved to backend:", await response.json())
//   } catch (error) {
//     console.error("Error saving policy:", error)
//   }

//   return newPolicy
// }


export interface PolicyEntry {
  id: string
  title: string
  type: "pdf" | "text"
  content?: string
  fileName?: string
  pdfData?: string
  uploadedBy: string
  uploadedAt: string
  description: string
  tags?: string[]
}
 
export interface PolicyData {
  policies: PolicyEntry[]
  metadata: {
    lastUpdated: string
    version: string
    totalPolicies: number
  }
}
 
const STORAGE_KEY = "employee-policies"
 
export function loadPolicies(): PolicyEntry[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data: PolicyData = JSON.parse(stored)
      return data.policies
    }
    return []
  } catch (error) {
    console.error("Error loading policies from sessionStorage:", error)
    return []
  }
}
 
export function savePolicy(policy: Omit<PolicyEntry, "id">): PolicyEntry {
  const newPolicy: PolicyEntry = {
    ...policy,
    id: Date.now().toString(),
  }
 
  try {
    const existingPolicies = loadPolicies()
    const updatedPolicies = [...existingPolicies, newPolicy]
 
    const dataToStore: PolicyData = {
      policies: updatedPolicies,
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: "1.0",
        totalPolicies: updatedPolicies.length,
      },
    }
 
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore))
    console.log("Policy saved to sessionStorage:", newPolicy)
  } catch (error) {
    console.error("Error saving policy to sessionStorage:", error)
  }
 
  return newPolicy
}
 
 