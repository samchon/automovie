/**
 * Read a finite per-call budget for draw-function readiness, subject
 * description/creation and drawing, in milliseconds. It is not a total build or
 * render deadline. Absence keeps the existing two-minute default. The upper
 * bound is Node's setTimeout limit: larger delays become 1 ms instead of the
 * requested wait
 * (https://nodejs.org/download/release/v22.23.0/docs/api/timers.html).
 */
export function readAutoMoviePageTimeout(
  value: string | number | undefined,
): number {
  if (value === undefined) return 120_000;

  const timeout: number = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 2_147_483_647)
    throw new Error(
      "Page --timeout-ms must be an integer from 1 to 2147483647 milliseconds",
    );
  return timeout;
}
