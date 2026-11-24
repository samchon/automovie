/** Reads a Node file system error's code, if the value carries one. */
export function readAutoMovieErrorCode(error: unknown): unknown {
  return error instanceof Error && "code" in error ? error.code : undefined;
}
