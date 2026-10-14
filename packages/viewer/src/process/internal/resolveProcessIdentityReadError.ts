/**
 * Interpret a failed native Linux read: ENOENT carries no present process identity, while every other failure propagates unchanged. A transport failure must not be normalized into an invented birth stamp or permission to stop.
 *
 * @evidence contracts/common.md#principled-implementation Returns null only for an ENOENT-classified native Linux read failure and rethrows every other supplied value unchanged.
 * @evidence contracts/common.md#clear-and-simple-design One pure absence classifier sits between Linux acquisition and controller authority, preserving discovery uncertainty rather than mixing it with termination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown errors, access denial and non-Error thrown values are not silently treated as exited processes; this boundary relies on native read errors rather than a forged caller error code.
 * @evidence contracts/common.md#meaningful-documentation Documents absence-versus-failure and exact thrown-value preservation, including why transport failure grants no authority.
 * @evidence contracts/performance.md#efficient-algorithms One optional code lookup and equality check are fixed work with no text parsing or process enumeration.
 * @evidence contracts/performance.md#reuse-equivalent-work No absence observation is retained across calls; later capture may independently discover a process that was previously absent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only null or the original thrown value escapes, and no file descriptor, child, handle or memo is acquired.
 */
export function resolveProcessIdentityReadError(error: unknown): null {
  if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return null;
  throw error;
}
