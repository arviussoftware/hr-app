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
  const userId = searchParams.get("userId") || session.user.id

  try {
    const client = await pool.connect()

    const result = await client.query(
      `SELECT 
        lb.*,
        lt.name as leave_type_name,
        lt.code as leave_type_code
      FROM leave_balances lb
      JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.user_id = $1 
      AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
      ORDER BY lt.name`,
      [userId],
    )

    client.release()

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching leave balances:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
