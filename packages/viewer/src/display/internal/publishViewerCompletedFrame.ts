import type { AutoMovieViewerDisplay } from "../AutoMovieViewerDisplay";

/*
 * Notify a supported canvas subscriber from the actual draw-completion owner.
 * The application explicitly subscribes with the public canvas attribute;
 * ordinary unobserved renders allocate no event. Native synchronous DOM
 * delivery avoids SDK replacements and also works across separately bundled
 * consumers. An explicit original redraw is meaningful even when camera, clock
 * and model facts match the preceding frame: graphics recovery still needs new
 * pixels. Ordinary producers retain their supplied idle/change classification.
 *
 * A canvas's own `dispatchEvent` serves, and its listeners receive the event
 * typed through `HTMLElementEventMap`.
 *
 * Completion belongs to the original draw producer. This publisher contributes
 * capture authority without implementing validation or delivery gates.
 */
export function publishViewerCompletedFrame(
  request: AutoMovieViewerDisplay.IPublishCompletedFrameRequest,
): void {
  const { canvas, frame, explicitDraw = false } = request;
  if (canvas.getAttribute?.("data-automovie-frame-observer") !== "on") return;
  canvas.dispatchEvent?.(
    new CustomEvent<AutoMovieViewerDisplay.ICompletedFrame>(
      "automovie:completed-frame",
      { detail: explicitDraw ? { ...frame, changed: true } : frame },
    ),
  );
}
