/**
 * Hold compile withdrawal while viewer candidates load their modules.
 *
 * A candidate page and its worker request their human modules over seconds; a compile withdrawn in between gave one candidate modules of two compiles, and restarting such a candidate could repeat for as long as edits kept arriving. While any hold is open, a withdrawal is recorded instead of applied, so every module a loading candidate asks for comes from the compile it started on; the last hold's release applies the recorded withdrawal at once, and the next candidate loads the next compile.
 *
 * @evidence contracts/common.md#principled-implementation A hold counter defers complete-project compile withdrawal while candidates load; only the latest requested reset runs when the final hold leaves.
 * @evidence contracts/common.md#clear-and-simple-design Counted holds and one pending reset keep candidate source coherence separate from compilation work and browser ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Holds delay invalidation rather than certifying mixed source as coherent; clearing the recorded callback before invocation prevents reentrant duplicate withdrawal.
 * @evidence contracts/common.md#meaningful-documentation Documentation explains multi-request loading, deferred withdrawal and application when the last hold closes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Counter updates and one callback slot choose no collection traversal or compilation algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Actual callers submit complete-project invalidation for this same compiler owner, so replacing the pending callback with the latest request covers prior withdrawals; unrelated arbitrary side effects are not promised equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The gate retains at most one pending reset, cleared before execution; hold count has no numeric cap and an unreleased caller hold keeps that reset pending indefinitely.
 */
export function createHumanViewerCompileGate(): {
  hold: () => void;
  release: () => void;
  withdraw: (reset: () => void) => void;
} {
  let holds: number = 0;
  let recorded: (() => void) | null = null;
  return {
    /** Open a hold. */
    hold: (): void => {
      ++holds;
    },

    /** Close a hold; the last one applies a recorded withdrawal. */
    release: (): void => {
      if (holds === 0) return;
      --holds;
      if (holds !== 0 || recorded === null) return;
      const withdraw: () => void = recorded;
      recorded = null;
      withdraw();
    },

    /** Withdraw the compile now, or record the withdrawal while a hold is open. */
    withdraw: (reset: () => void): void => {
      if (holds === 0) reset();
      else recorded = reset;
    },
  };
}
