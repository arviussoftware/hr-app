import pool from "../lib/db.js"
import fs from "fs"
import path from "path"

async function setupDatabase() {
  try {
    console.log("Setting up database...")

    // Read and execute the table creation script
    const createTablesSQL = fs.readFileSync(path.join(process.cwd(), "scripts", "001-create-tables.sql"), "utf8")

    const seedDataSQL = fs.readFileSync(path.join(process.cwd(), "scripts", "002-seed-data.sql"), "utf8")

    const client = await pool.connect()

    // Execute table creation
    console.log("Creating tables...")
    await client.query(createTablesSQL)
    console.log("Tables created successfully!")

    // Execute seed data
    console.log("Inserting seed data...")
    await client.query(seedDataSQL)
    console.log("Seed data inserted successfully!")

    client.release()
    console.log("Database setup completed!")

    process.exit(0)
  } catch (error) {
    console.error("Error setting up database:", error)
    process.exit(1)
  }
}

setupDatabase()
