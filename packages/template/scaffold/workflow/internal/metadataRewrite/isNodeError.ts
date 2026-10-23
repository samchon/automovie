/** Narrows an unknown error to a Node error carrying an error code. */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
