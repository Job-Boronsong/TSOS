import express, { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { createObjectStorageService, ObjectNotFoundError } from "../lib/objectStorageFactory";
import { ObjectStorageVpsService } from "../lib/objectStorageVps";
import { ObjectPermission } from "../lib/objectAcl";
// Suppress unused import warning — ObjectPermission is only used in commented example code
void ObjectPermission;

const router: IRouter = Router();
const objectStorageService = createObjectStorageService();

/**
 * GET /storage/health
 *
 * Diagnostic endpoint — returns which storage backend is active and whether
 * MinIO is reachable. Safe to call unauthenticated (no secrets returned).
 */
router.get("/storage/health", async (req: Request, res: Response) => {
  const isVps = objectStorageService instanceof ObjectStorageVpsService;
  const info: Record<string, unknown> = {
    backend: isVps ? "minio-vps" : "replit",
    minioEndpoint: isVps ? process.env.MINIO_ENDPOINT ?? "(not set)" : null,
    privateObjectDir: isVps ? process.env.PRIVATE_OBJECT_DIR ?? "(not set)" : null,
  };

  if (isVps) {
    // Ping MinIO with a ListBuckets-style HEAD request on the private bucket.
    try {
      const svc = objectStorageService as ObjectStorageVpsService;
      // Attempt to check if the private bucket exists by doing a HEAD on a
      // known non-existent key; MinIO returns 404 (object missing) not 403
      // (auth failure) when credentials are good and bucket exists.
      const testKey = "__health_check__";
      // We call getObjectEntityFile which does objectExists internally.
      // Catch ObjectNotFoundError (expected) vs any other error (bad).
      try {
        await svc.getObjectEntityFile(`/objects/${testKey}`);
      } catch (e) {
        if (e instanceof Error && e.message !== "Object not found") {
          throw e;
        }
        // ObjectNotFoundError means MinIO is up and bucket exists — good.
      }
      info.minioReachable = true;
      info.bucketStatus = "ok";
    } catch (err) {
      info.minioReachable = false;
      info.minioError = err instanceof Error ? err.message : String(err);
    }
  }

  res.json(info);
});

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", async (req: Request, res: Response) => {
  const { name, size, contentType } = req.body ?? {};
  if (!name || !contentType) {
    res.status(400).json({ error: "Missing required fields: name, contentType" });
    return;
  }

  try {
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
    res.json({ uploadURL, objectPath, metadata: { name, size: size ?? 0, contentType } });
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * PUT /storage/upload-proxy/*path
 *
 * VPS-only: Receives the file body from the browser and writes it directly
 * to MinIO. MinIO runs on an internal Docker network (minio:9000) the
 * browser cannot reach, so uploads are proxied through the API server.
 *
 * The raw body is pre-parsed by app.ts (express.raw before express.json).
 * We also fall back to manual stream reading in case that middleware didn't
 * fire (e.g. during development or middleware ordering edge-cases).
 */
router.put("/storage/upload-proxy/*path", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!(objectStorageService instanceof ObjectStorageVpsService)) {
      req.log.warn("Upload proxy called but VPS storage not active");
      res.status(404).json({ error: "Upload proxy not available" });
      return;
    }

    // Normalize wildcard param — Express 5 / path-to-regexp may return a
    // string, an array of segments, or include a leading slash.
    const rawParam = req.params.path;
    const rawStr = Array.isArray(rawParam)
      ? rawParam.join("/")
      : String(rawParam ?? "");
    // Strip any leading slash that some path-to-regexp versions prepend.
    const bucketAndObject = rawStr.startsWith("/") ? rawStr.slice(1) : rawStr;

    if (!bucketAndObject || !bucketAndObject.includes("/")) {
      req.log.warn({ param: rawStr }, "Upload proxy: bad path param");
      res.status(400).json({ error: "Invalid upload path" });
      return;
    }

    const contentType = String(
      req.headers["content-type"] ?? "application/octet-stream"
    );

    // --- Capture binary body ---
    // Preferred: express.raw() in app.ts already parsed it into req.body.
    // Fallback: read the request stream manually (works even if the
    // middleware didn't fire, e.g. in development where MINIO_ENDPOINT is
    // absent and the instanceof check above would have already returned).
    let body: Buffer;
    if (Buffer.isBuffer(req.body) && (req.body as Buffer).length > 0) {
      body = req.body as Buffer;
      req.log.info({ bytes: body.length, bucketAndObject }, "Upload proxy: body from express.raw");
    } else {
      req.log.info({ bodyType: typeof req.body }, "Upload proxy: falling back to stream read");
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        req.on("data", (chunk: unknown) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as ArrayBuffer))
        );
        req.on("end", resolve);
        req.on("error", reject);
      });
      body = Buffer.concat(chunks);
      req.log.info({ bytes: body.length, bucketAndObject }, "Upload proxy: stream read complete");
    }

    if (body.length === 0) {
      req.log.warn({ bucketAndObject }, "Upload proxy: received empty body");
      res.status(400).json({ error: "Empty file body — no bytes received" });
      return;
    }

    await objectStorageService.uploadObject(bucketAndObject, body, contentType);
    req.log.info({ bytes: body.length, bucketAndObject, contentType }, "Upload proxy: stored in MinIO");
    res.status(200).end();
  } catch (error) {
    req.log.error({ err: error }, "Upload proxy error");
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (uncomment when using replit-auth) ---
    // if (!req.isAuthenticated()) {
    //   res.status(401).json({ error: "Unauthorized" });
    //   return;
    // }
    // const canAccess = await objectStorageService.canAccessObjectEntity({
    //   userId: req.user.id,
    //   objectFile,
    //   requestedPermission: ObjectPermission.READ,
    // });
    // if (!canAccess) {
    //   res.status(403).json({ error: "Forbidden" });
    //   return;
    // }

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    // Check by constructor name because the VPS service defines its own
    // ObjectNotFoundError class which is a different identity from the one
    // exported by objectStorageFactory (Replit version).
    const isNotFound =
      error instanceof ObjectNotFoundError ||
      (error instanceof Error && error.constructor.name === "ObjectNotFoundError");
    if (isNotFound) {
      req.log.warn({ path: req.params.path }, "Object not found in storage");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
