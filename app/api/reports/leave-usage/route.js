import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import pool from "@/lib/db"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "manager" && session.user.role !== "hr_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const department = searchParams.get("department")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const client = await pool.connect()

    

    ///const result = await client.query('select * from get_leave_summary($1);', params)

    const result = await client.query(
  'SELECT * FROM get_leave_summary($1, $2, $3);',
  [department || null, startDate || null, endDate || null]
);
    client.release()

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error generating leave usage report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
