import crypto from "crypto";
import pool from "./configs/db.js";
import { hashPassword } from "./utils/password.js"; // ✅ import the real one

async function seed() {
  try {
    console.log("Seeding started...");

    const roles = ["Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];
    for (const role of roles) {
      await pool.execute("INSERT IGNORE INTO roles (name) VALUES (?)", [role]);
    }
    console.log("Roles seeded");

    const [adminCheck] = await pool.execute(`
      SELECT users.user_id FROM users
      JOIN roles ON users.role_id = roles.role_id
      WHERE roles.name = 'Manager'
    `);

    if (adminCheck.length === 0) {
      const [roleRow] = await pool.execute(
        "SELECT role_id FROM roles WHERE name = 'Manager'"
      );
      const role_id = roleRow[0].role_id;

      const hashedPassword = hashPassword("Admin@123"); // ✅ uses pbkdf2 sha512 now

      await pool.execute(
        `INSERT INTO users (full_name, email, password_hash, role_id) VALUES (?, ?, ?, ?)`,
        ["System Admin", "admin@fleetflow.com", hashedPassword, role_id]
      );

      console.log("Default Manager created");
    } else {
      console.log("Fleet Manager already exists");
    }

    console.log("Seeding completed successfully");
    process.exit();
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();