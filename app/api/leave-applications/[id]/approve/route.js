import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import pool from "@/lib/db"

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "manager" && session.user.role !== "hr_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, comments } = body // action: 'approve' or 'reject'
    const applicationId = params.id

    const client = await pool.connect()

    // Get application details
    const appResult = await client.query("SELECT * FROM leave_applications WHERE id = $1", [applicationId])

    if (appResult.rows.length === 0) {
      client.release()
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const application = appResult.rows[0]

    if (session.user.role === "manager") {
      // Manager approval
      await client.query(
        `UPDATE leave_applications 
         SET 
           manager_approval_status = $1,
           manager_approval_at = CURRENT_TIMESTAMP,
           manager_approval_by = $2,
           manager_comments = $3,
           status = $4
         WHERE id = $5`,
        [
          action === "approve" ? "approved" : "rejected",
          session.user.id,
          comments || "",
          action === "approve" ? "pending" : "rejected",
          applicationId,
        ],
      )
    } else if (session.user.role === "hr_admin") {
      // HR approval (final approval)
      await client.query(
        `UPDATE leave_applications 
         SET 
           hr_approval_status = $1,
           hr_approval_at = CURRENT_TIMESTAMP,
           hr_approval_by = $2,
           hr_comments = $3,
           status = $4
         WHERE id = $5`,
        [
          action === "approve" ? "approved" : "rejected",
          session.user.id,
          comments || "",
          action === "approve" ? "approved" : "rejected",
          applicationId,
        ],
      )

      // If approved, update leave balance
      if (action === "approve") {
        await client.query(
          `UPDATE leave_balances 
           SET 
             used_days = used_days + $1,
             remaining_days = remaining_days - $2
           WHERE user_id = $3 
           AND leave_type_id = $4
           AND year = EXTRACT(YEAR FROM CURRENT_DATE)`,
          [application.total_days, application.total_days, application.user_id, application.leave_type_id],
        )
      }
    }

    client.release()

    return NextResponse.json({ message: `Application ${action}d successfully` })
  } catch (error) {
    console.error("Error processing approval:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
