import type { AutoMovieViewerDisplay } from "../AutoMovieViewerDisplay.js";

/*
 * Admit an original synchronous redraw only from a new completed observation.
 * Explicit completion is preferred. A legacy void callback may instead expose a
 * new completed-frame record; an unchanged prior record cannot attest a draw.
 * An absent record time inherits the requested original-producer time, while a
 * supplied time must agree exactly. The producer must throw on refusal.
 */
export function redrawViewerCompletedFrame(
  request: AutoMovieViewerDisplay.IRedrawCompletedFrameRequest,
): void {
  const { seconds, options } = request;
  if (seconds < 0) throw new Error("A redraw requires nonnegative seconds.");
  const before: number = options.completedCount();
  const previous: Omit<AutoMovieViewerDisplay.ICompletedFrame, "control"> | undefined =
    options.readFrame();
  options.produce(seconds);
  if (options.completedCount() === before) {
    const current: Omit<AutoMovieViewerDisplay.ICompletedFrame, "control"> | undefined =
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
