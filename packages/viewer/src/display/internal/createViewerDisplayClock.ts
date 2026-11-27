import type { AutoMovieViewerDisplay } from "../AutoMovieViewerDisplay.js";

/*
 * Keep requested draw time separate from the last completed display clock. A
 * completion inherits its synchronous producer's time; an out-of-loop guide
 * redraw preserves the displayed time unless its producer supplies a new one.
 * Nested redraws restore the enclosing request after completion or refusal.
 * Seconds must be finite and nonnegative before clock state changes.
 */
export function createViewerDisplayClock(): AutoMovieViewerDisplay.IClock {
  let displayed: number = 0;
  let producing: number | undefined;
  const validate: (seconds: number) => void = (seconds: number): void => {
    if (seconds < 0)
      throw new Error(
        "A completed display clock requires nonnegative seconds.",
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
