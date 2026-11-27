/*
 * Run every release step of an inspector mount in order, then throw every
 * failure together: the one failure as it was, several as one `AggregateError`,
 * so a failed step never keeps a later resource alive.
 */
export function releaseAutoMovieInspectorSteps(
  steps: readonly (() => void)[],
): void {
  const failures: unknown[] = [];
  for (const step of steps)
    try {
      step();
    } catch (error) {
      failures.push(error);
    }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(failures, "The inspector mount failed to release");
}
