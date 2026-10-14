/**
 * Attempt independent pass-state restorations before reporting any failure. A primary setup failure stays first, and nested restoration aggregates are flattened so no failed owned resource disappears behind another error.
 *
 * @evidence contracts/common.md#principled-implementation Attempts every supplied synchronous operation before reporting, preserves the primary as first original object and iteratively flattens nonempty secondary aggregate causes in order without recursion-stack growth.
 * @evidence contracts/common.md#clear-and-simple-design One call-local cause list, explicit traversal stack and active-path set express fan-out/order/cycle handling; actual ownership and one-attempt guards remain with callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty, cyclic, malformed or uninspectable aggregates remain opaque original failures; failed introspection cannot skip later operations, primary identity is not flattened away and asynchronous callback settlement is not claimed.
 * @evidence contracts/common.md#meaningful-documentation Documents independent attempts, primary priority, ordered nested causes and opaque-cycle/inspection behavior rather than treating cleanup invocation as physical release proof.
 * @evidence contracts/performance.md#efficient-algorithms O(K+E) operation/aggregate-entry work plus error-array snapshots uses proportional temporary cause/stack references; iterative traversal avoids depth-dependent call-stack failure and never scans resource pixels.
 * @evidence contracts/performance.md#reuse-equivalent-work Each requested operation executes once in this invocation; callers supply sticky guards when repeat represents the same owned effect, and this primitive does not cache unrelated cleanup by equal error text.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The collector retains only call-local operation/cause references and throws after every attempt; no resource or running task is acquired, and input operation/aggregate populations have no independent cap here.
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
    const active: Set<object> = new Set();
    const pending: { error: unknown; leave: boolean }[] = [
      { error, leave: false },
    ];
    while (pending.length !== 0) {
      const current: { error: unknown; leave: boolean } = pending.pop()!;
      if (current.leave) {
        active.delete(current.error as object);
        continue;
      }
      let values: unknown[] | undefined;
      try {
        if (
          current.error instanceof AggregateError &&
          !active.has(current.error)
        ) {
          const errors: unknown = current.error.errors;
          if (Array.isArray(errors) && errors.length !== 0)
            values = Array.from(errors as unknown[]);
        }
      } catch {
        /* Preserve an original cause whose aggregate inspection is refused. */
      }
      if (values === undefined) {
        failures.push(current.error);
        continue;
      }
      active.add(current.error as object);
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
