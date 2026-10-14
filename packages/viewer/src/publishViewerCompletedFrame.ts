import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";

/**
 * Notify a supported canvas subscriber from the actual draw-completion owner. The application explicitly subscribes with the public canvas attribute; ordinary unobserved renders allocate no event. Native synchronous DOM delivery avoids SDK replacements and also works across separately bundled consumers. An explicit original redraw is meaningful even when camera, clock and model facts match the preceding frame: graphics recovery still needs new pixels. Ordinary producers retain their supplied idle/change classification.
 *
 * Completion belongs to the original draw producer. This publisher contributes capture authority without implementing validation or delivery gates.
 *
 * @evidence contracts/common.md#principled-implementation Checks the actual canvas opt-in attribute before dispatching the original draw owner completed-frame detail, marking an explicit original redraw changed even when preceding metadata is equal.
 * @evidence contracts/common.md#clear-and-simple-design Native DOM publication separates draw completion from subscription, capture validation and delivery policy without patching renderer methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unobserved canvas creates no event and no imaginary pixels; caller-supplied facts and explicitDraw must describe its completed draw, and synchronous DOM delivery is not asynchronous capture settlement proof.
 * @evidence contracts/common.md#meaningful-documentation Documents opt-in subscription, handled draw responsibility, explicit redraw meaning and absence of validation/delivery gates in this publisher.
 * @evidence contracts/performance.md#efficient-algorithms Coordination is fixed except consumer DOM dispatch work; explicit redraw makes one shallow detail copy, and no scene traversal or pixel read occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Ordinary producer idle/change classification is preserved; explicit redraw intentionally publishes a new completed effect instead of treating equal metadata as pixel equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The publisher retains no listener or frame after dispatch; event detail is borrowed or shallow-copied, and subscribers own any retained capture work and withdrawal.
 */
export function publishViewerCompletedFrame(
  canvas: {
    getAttribute?: (name: string) => string | null;
    dispatchEvent?: (event: Event) => boolean;
  },
  frame: IAutoMovieViewerCompletedFrame,
  explicitDraw: boolean = false,
): void {
  if (canvas.getAttribute?.("data-automovie-frame-observer") !== "on") return;
  canvas.dispatchEvent?.(
    new CustomEvent<IAutoMovieViewerCompletedFrame>(
      "automovie:completed-frame",
      { detail: explicitDraw ? { ...frame, changed: true } : frame },
    ),
  );
}
