/*
 * The text the inspector reports for a thrown value.
 */
export function messageOfAutoMovieInspectorError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
