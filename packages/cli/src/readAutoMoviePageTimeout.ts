/**
 * Read a finite per-call budget for draw-function readiness, subject
 * description/creation and drawing, in milliseconds. It is not a total
 * build or render deadline. Absence keeps the existing two-minute default.
 * The upper bound is Node's
 * setTimeout limit: larger delays become 1 ms instead of the requested wait
 * (https://nodejs.org/download/release/v22.23.0/docs/api/timers.html).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the covered draw-session stages, per-call scope, milliseconds, unchanged default, integer range and timer-overflow refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Converts command text or a host's numeric budget once and admits integers from 1 through 2147483647, the positive delay range of the timer bounding each page call.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One default, one numeric conversion and one range check serve both command readers and direct host callers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Invalid values throw rather than disabling the bound or silently using the default; no subject selects a special budget.
 * @evidence contracts/development/implementation.md#efficient-algorithms Parses the supplied scalar text once in O(N) time and space for N input characters; numeric inputs need constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure scalar reader coordinates no retained or in-flight work.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The reader retains no input or handle and returns one number.
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
