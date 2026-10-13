import { ReferenceError } from "./ReferenceError";
import { fail } from "./fail";

/**
 * Classify a native read failure without exposing source paths or diagnostics.
 * Intentional reference refusals retain their original identity; primitive and
 * unknown thrown values become a sanitized IO_ERROR instead of being dereferenced.
 *
 *
 * @evidence contracts/common.md#principled-implementation Intentional ReferenceError instances propagate unchanged; recognized native error codes map to fixed recovery categories and unknown values become IO_ERROR.
 * @evidence contracts/common.md#clear-and-simple-design One classifier keeps filesystem diagnosis separate from request policy and transport serialization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Primitive and null thrown values are handled safely, and external messages or paths are never reflected.
 * @evidence contracts/common.md#meaningful-documentation The comment states sanitized classification and original intentional refusal identity; the never return exposes that every path throws.
 * @evidence contracts/performance.md#efficient-algorithms A bounded code lookup and at most one new error require O(1) classification work aside from message and stack storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing intentional errors are reused unchanged; unrelated I/O failures receive a fresh operation-owned refusal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the thrown sanitized error escapes; foreign diagnostic objects are not retained or attached.
 */
export function resolveReferenceIoFailure(error: unknown): never {
  if (error instanceof ReferenceError) throw error;
  const code: unknown = error !== null && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "ENOENT") return fail("MISSING_FILE", "The requested file or directory does not exist.");
  if (code === "EACCES" || code === "EPERM") return fail("PERMISSION_DENIED", "The bound production does not permit this read.");
  if (code === "ELOOP" || code === "ENOTDIR") return fail("PATH_IDENTITY_CHANGED", "The path is linked, replaced or no longer a physical directory.");
  return fail("IO_ERROR", "The physical reference read failed.");
}
