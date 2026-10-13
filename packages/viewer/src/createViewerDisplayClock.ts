/**
 * Keep requested draw time separate from the last completed display clock.
 * A completion inherits its synchronous producer's time; an out-of-loop guide
 * redraw preserves the displayed time unless its producer supplies a new one.
 * Nested redraws restore the enclosing request after completion or refusal.
 * Seconds must be finite and nonnegative before clock state changes.
 *
 * @evidence contracts/common.md#principled-implementation Draw context, producer time and committed time have separate authority; idle requests do not advance displayed state.
 * @evidence contracts/common.md#clear-and-simple-design One numerical state owner serves loop, explicit draw and restoration without browser or renderer dependencies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No elapsed-time retry, guessed film sample or caller-specific clock branch supplies a completion.
 * @evidence contracts/common.md#meaningful-documentation Defines seconds, nested production and refusal state effects.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Keeps the clock paired with its actual completed display inside the mounted lifecycle.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Separates requested runtime work from the completed state an interactive viewer transfers.
 */
export function createViewerDisplayClock() {
  let displayed = 0;
  let producing: number | undefined;
  const validate = (seconds: number): void => {
    if (!Number.isFinite(seconds) || seconds < 0)
      throw new Error("A completed display clock requires finite nonnegative seconds.");
  };
  return {
    current: (): number => displayed,
    run: (seconds: number, produce: () => void): void => {
      validate(seconds);
      const previous = producing;
      producing = seconds;
      try { produce(); }
      finally { producing = previous; }
    },
    complete: (seconds?: number): number => {
      const next = seconds ?? producing ?? displayed;
      validate(next);
      displayed = next;
      return displayed;
    },
  };
}
