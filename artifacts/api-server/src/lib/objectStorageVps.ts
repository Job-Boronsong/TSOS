/**
 * MinIO-compatible S3 object storage adapter.
 * Used when MINIO_ENDPOINT is set (VPS / self-hosted deployments).
 * Drop-in replacement for the Replit sidecar-based objectStorage.ts.
 */
import { randomUUID } from "crypto";
import { createHmac, createHash } from "crypto";

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? "";
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? "";
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? "";

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const p = path.startsWith("/") ? path.slice(1) : path;
  const slash = p.indexOf("/");
  if (slash === -1) return { bucketName: p, objectName: "" };
  return { bucketName: p.slice(0, slash), objectName: p.slice(slash + 1) };
}

async function minioRequest(
  method: string,
  bucket: string,
  object: string,
  body?: Buffer | null,
  contentType?: string,
): Promise<Response> {
  const url = `${MINIO_ENDPOINT}/${bucket}/${object}`;
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateShort = dateStr.slice(0, 8);

  const bodyHash = body
    ? createHash("sha256").update(body).digest("hex")
    : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  const headers: Record<string, string> = {
    host: new URL(MINIO_ENDPOINT).host,
    "x-amz-date": dateStr,
    "x-amz-content-sha256": bodyHash,
    ...(contentType ? { "content-type": contentType } : {}),
  };

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalRequest = [
    method,
    `/${bucket}/${object}`,
    "",
    Object.keys(headers)
      .sort()
      .map((k) => `${k}:${headers[k]}`)
      .join("\n") + "\n",
    signedHeaders,
    bodyHash,
  ].join("\n");

  const scope = `${dateShort}/us-east-1/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateStr,
    scope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  // AWS SigV4 signing key derivation — order matters:
  //   HMAC("AWS4"+secret, date) → HMAC(result, region) → HMAC(result, service) → HMAC(result, "aws4_request")
  const signingKey = [dateShort, "us-east-1", "s3", "aws4_request"].reduce(
    (key, part) => createHmac("sha256", key).update(part).digest(),
    Buffer.from(`AWS4${MINIO_SECRET_KEY}`) as Buffer | string,
  );

  const signature = createHmac("sha256", signingKey as Buffer)
    .update(stringToSign)
    .digest("hex");

  headers[
    "authorization"
  ] = `AWS4-HMAC-SHA256 Credential=${MINIO_ACCESS_KEY}/${scope},SignedHeaders=${signedHeaders},Signature=${signature}`;

  return fetch(url, {
    method,
    headers,
    body: body ?? undefined,
    signal: AbortSignal.timeout(30_000),
  });
}

async function objectExists(bucket: string, objectName: string): Promise<boolean> {
  const res = await minioRequest("HEAD", bucket, objectName);
  return res.ok;
}

async function presignUrl(
  bucket: string,
  objectName: string,
  method: "PUT" | "GET",
  ttlSec: number,
): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateShort = dateStr.slice(0, 8);
  const expires = String(ttlSec);
  const scope = `${dateShort}/us-east-1/s3/aws4_request`;

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${MINIO_ACCESS_KEY}/${scope}`,
    "X-Amz-Date": dateStr,
    "X-Amz-Expires": expires,
    "X-Amz-SignedHeaders": "host",
  });

  const host = new URL(MINIO_ENDPOINT).host;
  const canonicalRequest = [
    method,
    `/${bucket}/${objectName}`,
    queryParams.toString(),
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateStr,
    scope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  // AWS SigV4 signing key derivation — same correct order as minioRequest.
  const signingKey = [dateShort, "us-east-1", "s3", "aws4_request"].reduce(
    (key, part) => createHmac("sha256", key).update(part).digest(),
    Buffer.from(`AWS4${MINIO_SECRET_KEY}`) as Buffer | string,
  );

  const signature = createHmac("sha256", signingKey as Buffer)
    .update(stringToSign)
    .digest("hex");

  return `${MINIO_ENDPOINT}/${bucket}/${objectName}?${queryParams}&X-Amz-Signature=${signature}`;
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageVpsService {
  getPublicObjectSearchPaths(): string[] {
    const raw = process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "";
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR ?? "";
    if (!dir) throw new Error("PRIVATE_OBJECT_DIR not set");
    return dir;
  }

  async searchPublicObject(filePath: string): Promise<{ bucket: string; key: string } | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const { bucketName, objectName } = parseObjectPath(`${searchPath}/${filePath}`);
      if (await objectExists(bucketName, objectName)) {
        return { bucket: bucketName, key: objectName };
      }
    }
    return null;
  }

  async downloadObject(ref: { bucket: string; key: string }, cacheTtlSec = 3600): Promise<Response> {
    const res = await minioRequest("GET", ref.bucket, ref.key);
    if (!res.ok) throw new ObjectNotFoundError();
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = res.headers.get("content-length");
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${cacheTtlSec}`,
      ...(contentLength ? { "Content-Length": contentLength } : {}),
    };
    return new Response(res.body, { headers });
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    // Return an API-relative path so the browser uploads through the API proxy,
    // not directly to minio:9000 (which is an internal Docker hostname the
    // browser cannot reach).
    return `/api/storage/upload-proxy/${bucketName}/${objectName}`;
  }

  async uploadObject(bucketAndObject: string, body: Buffer, contentType: string): Promise<void> {
    const path = bucketAndObject.startsWith("/") ? bucketAndObject : `/${bucketAndObject}`;
    const { bucketName, objectName } = parseObjectPath(path);
    const res = await minioRequest("PUT", bucketName, objectName, body, contentType);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`MinIO upload failed (${res.status}): ${text}`);
    }
  }

  async getObjectEntityFile(objectPath: string): Promise<{ bucket: string; key: string }> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) throw new ObjectNotFoundError();
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) entityDir += "/";
    const { bucketName, objectName } = parseObjectPath(`${entityDir}${entityId}`);
    if (!(await objectExists(bucketName, objectName))) throw new ObjectNotFoundError();
    return { bucket: bucketName, key: objectName };
  }

  normalizeObjectEntityPath(rawPath: string): string {
    // rawPath is what getObjectEntityUploadURL() returned:
    //   "/api/storage/upload-proxy/tsos-private/uploads/uuid"
    // Convert to the path the browser uses to fetch the stored file:
    //   "/objects/uploads/uuid"
    const prefix = "/api/storage/upload-proxy/";
    if (rawPath.startsWith(prefix)) {
      const bucketAndObject = rawPath.slice(prefix.length); // "tsos-private/uploads/uuid"
      const slashIdx = bucketAndObject.indexOf("/");
      const objectName = slashIdx === -1 ? bucketAndObject : bucketAndObject.slice(slashIdx + 1);
      return `/objects/${objectName}`;
    }
    return rawPath;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, _aclPolicy: unknown): Promise<string> {
    return rawPath;
  }

  async canAccessObjectEntity(_opts: {
    userId?: string;
    objectFile: { bucket: string; key: string };
    requestedPermission?: string;
  }): Promise<boolean> {
    return true;
  }
}
