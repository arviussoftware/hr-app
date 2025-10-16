import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import pool from "@/lib/db"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const userId = searchParams.get("userId")

  try {
    const client = await pool.connect()

    let query = `
      SELECT 
        la.*,
        lt.name as leave_type_name,
        u.first_name || ' ' || u.last_name as employee_name,
        u.employee_id,
        u.department
      FROM leave_applications la
      JOIN leave_types lt ON la.leave_type_id = lt.id
      JOIN users u ON la.user_id = u.id
      WHERE 1=1
    `

    const params = []
    let paramCount = 0

    if (session.user.role === "employee") {
      paramCount++
      query += ` AND la.user_id = $${paramCount}`
      params.push(session.user.id)
    } else if (session.user.role === "manager") {
      paramCount++
      query += ` AND (la.user_id IN (SELECT id FROM users WHERE manager_id = $${paramCount}) OR la.user_id = $${paramCount + 1})`
      params.push(session.user.id, session.user.id)
      paramCount++
    }

    if (status) {
      paramCount++
      query += ` AND la.status = $${paramCount}`
      params.push(status)
    }

    if (userId && (session.user.role === "manager" || session.user.role === "hr_admin")) {
      paramCount++
      query += ` AND la.user_id = $${paramCount}`
      params.push(userId)
    }

    query += ` ORDER BY la.created_at DESC`

    const result = await client.query(query, params)
    client.release()

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching leave applications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { leaveTypeId, startDate, endDate, totalDays, reason, documentUrl } = body

    const client = await pool.connect()

    // Check leave balance
    const balanceResult = await client.query(
      "SELECT remaining_days FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = EXTRACT(YEAR FROM CURRENT_DATE)",
      [session.user.id, leaveTypeId],
    )

    if (balanceResult.rows.length === 0 || balanceResult.rows[0].remaining_days < totalDays) {
      client.release()
      return NextResponse.json({ error: "Insufficient leave balance" }, { status: 400 })
    }

    // Create leave application
    const result = await client.query(
      `INSERT INTO leave_applications (
        user_id, leave_type_id, start_date, end_date, total_days, reason, document_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [session.user.id, leaveTypeId, startDate, endDate, totalDays, reason, documentUrl],
    )

    client.release()

    return NextResponse.json({ id: result.rows[0].id, message: "Leave application submitted successfully" })
  } catch (error) {
    console.error("Error creating leave application:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
