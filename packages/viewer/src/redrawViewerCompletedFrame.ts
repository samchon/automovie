import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";

/**
 * Admit an original synchronous redraw only from a new completed observation.
 * Explicit completion is preferred. A legacy void callback may instead expose a
 * new completed-frame record; an unchanged prior record cannot attest a draw.
 * An absent record time inherits the requested original-producer time, while a
 * supplied time must agree exactly. The producer must throw on refusal.
 */
export function redrawViewerCompletedFrame(
  seconds: number,
  options: {
    /** Actual completed publication count. */
    completedCount: () => number;
    /** Actual last completed scene seconds. */
    completedSeconds: () => number;
    /** Current original-producer observation, absent before any completed draw. */
    readFrame: () =>
      | Omit<IAutoMovieViewerCompletedFrame, "control">
      | undefined;
    /** Original draw; must throw if it refuses the requested state. */
    produce: (seconds: number) => void;
    /** Publish a newly supplied legacy producer observation at these seconds. */
    publish: (
      frame: Omit<IAutoMovieViewerCompletedFrame, "control">,
      seconds: number,
    ) => void;
  },
): void {
  if (seconds < 0) throw new Error("A redraw requires nonnegative seconds.");
  const before: number = options.completedCount();
  const previous: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined =
    options.readFrame();
  options.produce(seconds);
  if (options.completedCount() === before) {
    const current: Omit<IAutoMovieViewerCompletedFrame, "control"> | undefined =
      options.readFrame();
    if (current === undefined || current === previous)
      throw new Error(
        "The original viewer producer did not complete a new redraw.",
      );
    if (
      current.elapsedSeconds !== undefined &&
      current.elapsedSeconds !== seconds
    )
      throw new Error(
        "The original viewer producer completed a different scene time.",
      );
    options.publish(current, seconds);
  }
  if (
    options.completedCount() === before ||
    options.completedSeconds() !== seconds
  )
    throw new Error(
      "The original viewer producer did not complete the requested scene time.",
    );
}
