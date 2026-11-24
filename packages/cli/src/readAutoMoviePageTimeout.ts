/**
 * Read the per-call budget for draw-function readiness, subject
 * description/creation and drawing, in milliseconds: a number as given, or
 * command text converted by `Number`. It is not a total build or render
 * deadline. Absence keeps the existing two-minute default. The value is not
 * admitted here; Node's setTimeout applies its own rules to it, and a delay
 * over its limit becomes 1 ms instead of the requested wait
 * (https://nodejs.org/download/release/v22.23.0/docs/api/timers.html).
 *
 * @param value The budget as a number or command text, or absent.
 * @returns The budget, milliseconds.
 */
export function readAutoMoviePageTimeout(
  value: string | number | undefined,
): number {
  if (value === undefined) return 120_000;

  return typeof value === "number" ? value : Number(value);
}
