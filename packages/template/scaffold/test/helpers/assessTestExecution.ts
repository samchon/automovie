import type { DynamicExecutor } from "@nestia/e2e";

/**
 * Preserve assertion failures and require valid, nondecreasing executor timestamps.
 * Milliseconds describe the run; elapsed duration has no acceptance threshold.
 */
export function assessTestExecution(
  execution: Pick<
    DynamicExecutor.IExecution,
    "error" | "started_at" | "completed_at"
  >,
): { passed: boolean; elapsedMs: number | null } {
  const started: number = new Date(execution.started_at).getTime();
  const completed: number = new Date(execution.completed_at).getTime();
  const elapsedMs: number | null =
    Number.isFinite(started) &&
    Number.isFinite(completed) &&
    completed >= started
      ? completed - started
      : null;
  return { passed: execution.error === null && elapsedMs !== null, elapsedMs };
}
