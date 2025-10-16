import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import pool from "./db.js"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const client = await pool.connect()

          const result = await client.query(
            "SELECT id, email, password, first_name, last_name, employee_id, role, department, location FROM users WHERE email = $1 AND is_active = true",
            [credentials.email],
          )

          client.release()

          const user = result.rows[0]
          if (!user) {
            return null
          }

          // For demo purposes, we'll accept 'password123' for all users
          // In production, you would properly hash and compare passwords
          debugger;
          const isPasswordValid =
            credentials.password === "password123" || (await bcrypt.compare(credentials.password, user.password))

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
            employeeId: user.employee_id,
            department: user.department,
            location: user.location,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.employeeId = user.employeeId
        token.department = user.department
        token.location = user.location
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.employeeId = token.employeeId
        session.user.department = token.department
        session.user.location = token.location
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-here",
}
