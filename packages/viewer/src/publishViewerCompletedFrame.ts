import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";

/**
 * Notify a supported canvas subscriber from the actual draw-completion owner.
 * The application explicitly subscribes with the public canvas attribute;
 * ordinary unobserved renders allocate no event. Native synchronous DOM delivery
 * avoids SDK replacements and also works across separately bundled consumers.
 * An explicit original redraw is meaningful even when camera, clock and model
 * facts match the preceding frame: graphics recovery still needs new pixels.
 * Ordinary producers retain their supplied idle/change classification.
 *
 * Completion belongs to the original draw producer. This publisher contributes capture authority without implementing validation or delivery gates.
 *
 * @evidence contracts/common.md#principled-implementation The original producer dispatches only after its own draw completed.
 * @evidence contracts/common.md#clear-and-simple-design One canvas-scoped synchronous event carries the existing scene/camera and optional state controller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no renderer monkeypatch, automatic filesystem writer or named-consumer branch.
 * @evidence contracts/common.md#meaningful-documentation Defines opt-in and timing independently of admission or review acceptance.
 * @evidence requirements/review/subject-inspection.md#review-subject-evidence Supplies original completed display facts to the application capture owner.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-observation Keeps observation with the actual native producer.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-evidence-producer-authority Publishes completion supplied by the original draw owner; the capture caller reads the actually loaded page revision rather than promoting a requested state or old file to current evidence.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Publishes completion supplied by the original draw owner; the capture caller reads the actually loaded page revision rather than promoting a requested state or old file to current evidence.
 */
export function publishViewerCompletedFrame(canvas: {
  getAttribute?: (name: string) => string | null;
  dispatchEvent?: (event: Event) => boolean;
}, frame: IAutoMovieViewerCompletedFrame, explicitDraw = false): void {
  if (canvas.getAttribute?.("data-automovie-frame-observer") !== "on") return;
  canvas.dispatchEvent?.(new CustomEvent<IAutoMovieViewerCompletedFrame>(
    "automovie:completed-frame", { detail: explicitDraw ? { ...frame, changed: true } : frame },
  ));
}
