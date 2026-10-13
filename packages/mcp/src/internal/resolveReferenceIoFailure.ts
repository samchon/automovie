import { ReferenceError, fail } from "./referenceError";

/**
 * Classify a native read failure without exposing source paths or diagnostics.
 * Intentional reference refusals retain their original identity; primitive and
 * unknown thrown values become a sanitized IO_ERROR instead of being dereferenced.
 */
export function resolveReferenceIoFailure(error: unknown): never {
  if (error instanceof ReferenceError) throw error;
  const code = error !== null && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "ENOENT") return fail("MISSING_FILE", "The requested file or directory does not exist.");
  if (code === "EACCES" || code === "EPERM") return fail("PERMISSION_DENIED", "The bound production does not permit this read.");
  if (code === "ELOOP" || code === "ENOTDIR") return fail("PATH_IDENTITY_CHANGED", "The path is linked, replaced or no longer a physical directory.");
  return fail("IO_ERROR", "The physical reference read failed.");
}
