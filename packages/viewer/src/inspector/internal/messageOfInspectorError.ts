/*
 * The text the inspector reports for a thrown value.
 */
export function messageOfInspectorError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
