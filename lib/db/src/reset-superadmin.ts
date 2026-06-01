/**
 * Emergency superadmin password reset.
 *
 * Usage:
 *   SUPER_ADMIN_PASSWORD=<new-password> pnpm --filter @workspace/db run reset-superadmin
 *
 * The password must be at least 8 characters.
 * Clears any lockout on the account as well.
 */
import pg from "pg";

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const newPassword = process.env.SUPER_ADMIN_PASSWORD;
if (!newPassword) {
  console.error("SUPER_ADMIN_PASSWORD env var is required.");
  console.error("  Example: SUPER_ADMIN_PASSWORD=MyStr0ngPass pnpm --filter @workspace/db run reset-superadmin");
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error("SUPER_ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function main() {
  await client.connect();

  await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  const { rows } = await client.query(
    `UPDATE users
     SET password_hash        = crypt($1, gen_salt('bf', 10)),
         failed_login_attempts = 0,
         locked_until          = NULL
     WHERE role = 'super_admin'
     RETURNING username`,
    [newPassword]
  );

  if (rows.length === 0) {
    console.error("No super_admin user found. Run 'pnpm --filter @workspace/db run seed' first.");
    await client.end();
    process.exit(1);
  }

  console.log(`✓ Password reset for superadmin (username: ${rows[0].username})`);
  console.log(`✓ Login with: superadmin / ${newPassword}`);
  await client.end();
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
