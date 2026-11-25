/** Renders thrown values without losing unexpected diagnostics. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
