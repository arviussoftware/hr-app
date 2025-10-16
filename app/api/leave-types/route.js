import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import pool from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await pool.connect()

    const result = await client.query("SELECT * FROM leave_types WHERE is_active = true ORDER BY name")

    client.release()

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching leave types:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "hr_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, code, description, maxDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresDocument } = body

    const client = await pool.connect()

    const result = await client.query(
      `INSERT INTO leave_types (
        name, code, description, max_days_per_year, carry_forward_allowed, 
        max_carry_forward_days, requires_document
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [name, code, description, maxDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresDocument],
    )

    client.release()

    return NextResponse.json({ id: result.rows[0].id, message: "Leave type created successfully" })
  } catch (error) {
    console.error("Error creating leave type:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
