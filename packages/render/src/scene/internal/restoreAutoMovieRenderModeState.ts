/**
 * Attempt independent pass-state restorations before reporting any failure. A
 * primary setup failure stays first, and nested restoration aggregates are
 * flattened so no failed owned resource disappears behind another error.
 */
export function restoreAutoMovieRenderModeState(
  operations: readonly (() => void)[],
  primary: { error: unknown },
): never;
export function restoreAutoMovieRenderModeState(
  operations: readonly (() => void)[],
): void;
export function restoreAutoMovieRenderModeState(
  operations: readonly (() => void)[],
  primary?: { error: unknown },
): void {
  const failures: unknown[] = primary === undefined ? [] : [primary.error];
  const append: (error: unknown) => void = (error: unknown): void => {
    const active: Set<unknown> = new Set();
    const pending: { error: unknown; leave: boolean }[] = [
      { error, leave: false },
    ];
    while (pending.length !== 0) {
      const current: { error: unknown; leave: boolean } = pending.pop()!;
      if (current.leave) {
        active.delete(current.error);
        continue;
      }
      const values: unknown[] | undefined =
        current.error instanceof AggregateError &&
        !active.has(current.error) &&
        current.error.errors.length !== 0
          ? [...current.error.errors]
          : undefined;
      if (values === undefined) {
        failures.push(current.error);
        continue;
      }
      active.add(current.error);
      pending.push({ error: current.error, leave: true });
      for (let index: number = values.length - 1; index >= 0; --index)
        pending.push({ error: values[index], leave: false });
    }
  };
  for (const operation of operations) {
    try {
      operation();
    } catch (error) {
      append(error);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1)
    throw new AggregateError(
      failures,
      "Render-mode setup or restoration failed.",
    );
}
