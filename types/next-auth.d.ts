declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      employeeId: string
      department: string
      location: string
    }
  }

  interface User {
    role: string
    employeeId: string
    department: string
    location: string
  }
}
