/**
 * Production seed — runs after drizzle-kit push.
 * Creates the superadmin user, session table, stock tables, and default
 * platform settings if they don't exist.
 * Uses pgcrypto's crypt() (produces $2a$ hashes compatible with bcryptjs).
 *
 * Superadmin password logic:
 *   - SUPER_ADMIN_PASSWORD env var is set  → always upsert (reset) the password
 *   - SUPER_ADMIN_PASSWORD not set, user missing → create with default "superadmin123"
 *   - SUPER_ADMIN_PASSWORD not set, user exists  → leave password untouched
 *
 * All DDL is idempotent and self-healing — safe to run on every deployment.
 */
import pg from "pg";

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

/** Returns true if the named table exists in the public schema. */
async function tableExists(name: string): Promise<boolean> {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return rows.length > 0;
}

async function seed() {
  await client.connect();
  console.log("Seeding database...");

  // Enable pgcrypto for bcrypt support
  await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");

  // ── Self-healing: detect drizzle-kit rename accident ─────────────────────────
  // drizzle-kit push --force may rename the existing `session` table to
  // `stock_items` instead of creating stock_items fresh.  We detect this by
  // looking for the `session_pkey` index sitting on the `stock_items` table
  // (PostgreSQL index names are schema-scoped so the old name is preserved).
  // When found, we rename stock_items back to session before any other DDL runs.
  const { rows: misnamedSession } = await client.query(`
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename  = 'stock_items'
      AND indexname  = 'session_pkey'
  `);
  if (misnamedSession.length > 0) {
    await client.query(`ALTER TABLE stock_items RENAME TO session`);
    console.log("  ✓ Restored session table (drizzle-kit had misnamed it stock_items)");
  }

  // ── Superadmin account ───────────────────────────────────────────────────────
  // If SUPER_ADMIN_PASSWORD is provided we ALWAYS upsert so the seed is the
  // single source of truth for the superadmin password on every deploy.
  // Without the env var we fall back to DO NOTHING (safe for environments where
  // the password has been deliberately changed through the app).
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (superAdminPassword) {
    if (superAdminPassword.length < 8) {
      console.error("  ✗ SUPER_ADMIN_PASSWORD must be at least 8 characters");
      process.exit(1);
    }
    await client.query(
      `INSERT INTO users (username, password_hash, name, role)
       VALUES ('superadmin', crypt($1, gen_salt('bf', 10)), 'Super Admin', 'super_admin')
       ON CONFLICT (username) DO UPDATE
         SET password_hash        = crypt($1, gen_salt('bf', 10)),
             failed_login_attempts = 0,
             locked_until          = NULL`,
      [superAdminPassword]
    );
    console.log("  ✓ Superadmin password set from SUPER_ADMIN_PASSWORD env var");
  } else {
    const { rowCount } = await client.query(
      `INSERT INTO users (username, password_hash, name, role)
       VALUES ('superadmin', crypt('superadmin123', gen_salt('bf', 10)), 'Super Admin', 'super_admin')
       ON CONFLICT (username) DO NOTHING`
    );
    if (rowCount && rowCount > 0) {
      console.log("  ✓ Superadmin created (username: superadmin, password: superadmin123)");
      console.log("  ⚠  Set SUPER_ADMIN_PASSWORD env var before running seed to use a custom password.");
    } else {
      console.log("  ✓ Superadmin already exists — password unchanged");
      console.log("  ℹ  To reset the superadmin password, set SUPER_ADMIN_PASSWORD and re-run seed.");
    }
  }

  // Create session table for connect-pg-simple.
  // We gate on tableExists so the named CONSTRAINT/INDEX "session_pkey" is only
  // declared when the table (and therefore its backing index) doesn't exist yet.
  if (!(await tableExists("session"))) {
    await client.query(`
      CREATE TABLE "session" (
        "sid"    varchar        NOT NULL COLLATE "default",
        "sess"   json           NOT NULL,
        "expire" timestamp(6)   NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE)
    `);
    console.log("  ✓ Session table created");
  }
  await client.query(
    `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")`
  );
  console.log("  ✓ Session table ready");

  // ── Stock tables ─────────────────────────────────────────────────────────────
  // Created here as raw SQL so they are always present regardless of what
  // drizzle-kit push does to them.
  if (!(await tableExists("stock_items"))) {
    await client.query(`
      CREATE TABLE stock_items (
        id               serial        PRIMARY KEY,
        school_id        integer       NOT NULL REFERENCES schools(id),
        name             text          NOT NULL,
        category         text          NOT NULL DEFAULT 'other',
        unit             text          NOT NULL DEFAULT 'pieces',
        reorder_level    numeric(10,2) NOT NULL DEFAULT '0',
        current_quantity numeric(10,2) NOT NULL DEFAULT '0',
        created_at       timestamptz   NOT NULL DEFAULT now()
      )
    `);
    console.log("  ✓ stock_items table created");
  }
  if (!(await tableExists("stock_movements"))) {
    await client.query(`
      CREATE TABLE stock_movements (
        id             serial        PRIMARY KEY,
        school_id      integer       NOT NULL REFERENCES schools(id),
        item_id        integer       NOT NULL REFERENCES stock_items(id),
        type           text          NOT NULL,
        quantity       numeric(10,2) NOT NULL,
        reference      text,
        notes          text,
        cost           numeric(10,2),
        expenditure_id integer,
        date           date          NOT NULL,
        created_by     integer,
        created_at     timestamptz   NOT NULL DEFAULT now()
      )
    `);
    console.log("  ✓ stock_movements table created");
  }
  await client.query(`CREATE INDEX IF NOT EXISTS stock_items_school_idx     ON stock_items(school_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS stock_movements_school_idx  ON stock_movements(school_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS stock_movements_item_idx    ON stock_movements(item_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS stock_movements_date_idx    ON stock_movements(school_id, date)`);
  console.log("  ✓ Stock tables ready");

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
