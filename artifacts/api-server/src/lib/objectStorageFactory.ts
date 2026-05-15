import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectStorageVpsService, ObjectNotFoundError as VpsObjectNotFoundError } from "./objectStorageVps";

export { ObjectNotFoundError };

export function createObjectStorageService(): ObjectStorageService | ObjectStorageVpsService {
  if (process.env.MINIO_ENDPOINT) {
    return new ObjectStorageVpsService();
  }
  return new ObjectStorageService();
}
