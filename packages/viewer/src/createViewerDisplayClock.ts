/**
 * Keep requested draw time separate from the last completed display clock.
 * A completion inherits its synchronous producer's time; an out-of-loop guide
 * redraw preserves the displayed time unless its producer supplies a new one.
 * Nested redraws restore the enclosing request after completion or refusal.
 * Seconds must be finite and nonnegative before clock state changes.
 *
 * @evidence contracts/common.md#principled-implementation Separates a validated synchronous producing-time scope from last completed time; completion prefers explicit seconds, then nested producer time, then prior display, and finally restores the enclosing producer clock even after refusal. Async work must complete with explicit time because run's scope is synchronous.
 * @evidence contracts/common.md#clear-and-simple-design Keeps two scalar clock states and one admission rule instead of tying requested seek to displayed completion or advancing an accumulator each frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture seek time or dropped-frame estimate advances the display; negative/nonfinite requests refuse before mutation and failed producers do not overwrite the enclosing request state.
 * @evidence contracts/common.md#meaningful-documentation Gives requested-versus-completed time, nested scope restoration, finite nonnegative seconds and out-of-loop completion precedence.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-count scalar validation/assignment per request/completion, constant retained storage plus the actual synchronous call-stack depth of nested producers.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses last completed time for out-of-loop redraws without a new authoritative timestamp; effectful producer callbacks are still invoked rather than skipped because their requested seconds match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds only displayed/producing scalars, borrows each synchronous callback for its invocation and starts no timer, worker or render task; no cancellation/resource handle is acquired.
 */
export function createViewerDisplayClock(): {
  current: () => number;
  run: (seconds: number, produce: () => void) => void;
  complete: (seconds?: number) => number;
} {
  let displayed: number = 0;
  let producing: number | undefined;
  const validate: (seconds: number) => void = (seconds: number): void => {
    if (!Number.isFinite(seconds) || seconds < 0)
      throw new Error(
        "A completed display clock requires finite nonnegative seconds.",
      );
  };
  return {
    current: (): number => displayed,
    run: (seconds: number, produce: () => void): void => {
      validate(seconds);
      const previous: number | undefined = producing;
      producing = seconds;
      try {
        produce();
      } finally {
        producing = previous;
      }
    },
    complete: (seconds?: number): number => {
      const next: number = seconds ?? producing ?? displayed;
      validate(next);
      displayed = next;
      return displayed;
    },
  };
}
