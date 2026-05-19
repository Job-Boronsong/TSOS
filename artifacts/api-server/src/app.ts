import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import "./lib/cron";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required but was not provided.");
}

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

// Rate limit auth login endpoints: 20 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  skip: () => process.env.NODE_ENV === "development",
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/teacher-auth/login", loginLimiter);

app.use("/api", router);

// Global error handler — must be 4-argument to be recognised by Express as an error handler.
// Without this, Express sends its default HTML error page which:
//   1. Returns text/html instead of JSON (breaks client error parsing)
//   2. Swallows the error — nothing gets logged to pino
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: any, res: any, _next: any) => {
  const status = err?.status ?? err?.statusCode ?? 500;
  const message = err?.message ?? "Internal server error";
  // Log with full stack so production pino logs capture the crash details.
  req.log?.error({ err, status }, `Unhandled error: ${message}`);
  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
});

export default app;
