import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { readFileSync } from "fs";

// Load .env manually
const envContent = readFileSync(".env", "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    const value = valueParts.join("=").replace(/^["']|["']$/g, "");
    process.env[key.trim()] = value.trim();
  }
});

async function main() {
  console.log("DATABASE_URL set:", !!process.env.DATABASE_URL);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  const email = "admin@viralkid.com";

  try {
    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      // Update password
      await pool.query(
        'UPDATE "User" SET "passwordHash" = $1 WHERE email = $2',
        [passwordHash, email]
      );
      console.log("User password updated:", email);
    } else {
      // Create user
      const id = `user_${Date.now()}`;
      await pool.query(
        'INSERT INTO "User" (id, email, "passwordHash", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW())',
        [id, email, passwordHash]
      );
      console.log("User created:", email);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

main();
