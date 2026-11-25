/** Narrows an unknown error to an Error with an optional Node errno code. */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
