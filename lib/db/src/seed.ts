/**
 * Production seed — runs after drizzle-kit push.
 * Creates the superadmin user and default platform settings if they don't exist.
 * Uses pgcrypto's crypt() so bcryptjs can verify the password at runtime.
 */
import pg from "pg";

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function seed() {
  await client.connect();
  console.log("Seeding database...");

  // Enable pgcrypto for bcrypt support
  await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  // Create superadmin if not exists
  const { rowCount } = await client.query(
    `INSERT INTO users (username, password_hash, name, role)
     VALUES ('superadmin', crypt('superadmin123', gen_salt('bf', 10)), 'Super Admin', 'super_admin')
     ON CONFLICT (username) DO NOTHING`
  );
  if (rowCount && rowCount > 0) {
    console.log("  ✓ Superadmin created (username: superadmin, password: superadmin123)");
    console.log("  ⚠  Change the superadmin password immediately after first login!");
  } else {
    console.log("  ✓ Superadmin already exists — skipped");
  }

  // Create default platform settings row if not exists
  await client.query(
    `INSERT INTO platform_settings (id, monthly_price)
     VALUES (1, 500)
     ON CONFLICT (id) DO NOTHING`
  );
  console.log("  ✓ Platform settings ready");

  await client.end();
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
