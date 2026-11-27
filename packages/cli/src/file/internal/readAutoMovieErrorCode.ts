/*
 * Reads a Node file system error's code: the `code` Node's declared error
 * (`NodeJS.ErrnoException`) carries, or undefined for a value that is not an
 * error or an error without one.
 * Parameter error: The caught value.
 * Returns: The error's code, or undefined.
 */
export function readAutoMovieErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const errno: NodeJS.ErrnoException = error;
  return errno.code;
}