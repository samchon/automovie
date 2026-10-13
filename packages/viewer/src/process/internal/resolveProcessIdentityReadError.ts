/**
 * Interpret a failed native Linux read: ENOENT carries no present process
 * identity, while every other failure propagates unchanged. A transport failure
 * must not be normalized into an invented birth stamp or permission to stop.
 *
 * @evidence contracts/common.md#principled-implementation Only the native missing-record error is absence; all other discovery failures retain their original value.
 * @evidence contracts/common.md#clear-and-simple-design Owns failure interpretation separately from filesystem access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not hide access failures or synthesize process identity after discovery failed.
 * @evidence contracts/common.md#meaningful-documentation States the one absent outcome and unchanged error propagation.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Missing or failed identity discovery cannot authorize another process's termination.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Interprets native process-record read failures for the Node host.
 */
export function resolveProcessIdentityReadError(error: unknown): null {
  if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return null;
  throw error;
}
