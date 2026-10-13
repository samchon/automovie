/**
 * Interpret a failed native Linux read: ENOENT carries no present process
 * identity, while every other failure propagates unchanged. A transport failure
 * must not be normalized into an invented birth stamp or permission to stop.
 */
export function resolveProcessIdentityReadError(error: unknown): null {
  if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return null;
  throw error;
}
