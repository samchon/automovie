import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";

/**
 * Context creation and original-producer completion settings for one mounted viewer. These values configure output conditions; they do not independently certify cross-hardware pixel equality or actual rendered appearance.
 *
 * @evidence contracts/common.md#principled-implementation Per-mount antialiasing and buffer preservation belong to context creation, pixel ratio controls output dimensions and handled-frame hooks preserve the original producer's completed facts.
 * @evidence contracts/common.md#clear-and-simple-design One options shape keeps native context settings separate from the mount's loop and the producer's actual completed-frame observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disabling antialiasing avoids blended structural boundaries but is not a claim of GPU-independent output; handled draws need original completion rather than an invented verification render.
 * @evidence contracts/common.md#meaningful-documentation Members describe defaults, creation-only settings, output sizing and required handled-frame completion/redraw ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This options shape implements no render loop or framebuffer readback algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Equal context options do not establish equivalent scene/source/frame effects or authorize sharing one mount.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These borrowed callbacks and scalars acquire no renderer; mountViewer owns the context and loop they configure.
 *
 * @author Samchon
 */
export interface IMountViewerOptions {
  /** Creation-time multisample antialiasing, true by default; false avoids segment-edge blending without proving cross-GPU byte equality. */
  antialias?: boolean;

  /** Explicit canvas pixel ratio; absence preserves the renderer's default and a capture host can pin one for fixed output dimensions. */
  pixelRatio?: number;

  /** Creation-time native buffer preservation, false by default; an explicit readback host must choose its required lifetime. */
  preserveDrawingBuffer?: boolean;

  /**
   * Return the original handled producer's completed scene/camera/pass, or undefined when it has no completed observation.
   *
   * @evidence contracts/common.md#principled-implementation The hook exposes the producer's actual completed draw rather than a requested display state or nominal scene passed to mount.
   * @evidence contracts/common.md#clear-and-simple-design Handled composites retain completion ownership while mount attaches its clock/control to the supplied record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent handled completion is not replaced with a fabricated ordinary beauty observation.
   * @evidence contracts/common.md#meaningful-documentation The member documents original-producer facts and explicit unavailable observation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This observation capability selects no scene rendering or composition algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Record identity suppresses idle ordinary publication in mount but is not by itself canonical pixel/source equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The hook borrows producer state; the mounted owner retains its callback for that mount's lifetime.
   */
  completedFrame?: () =>
    | Omit<IAutoMovieViewerCompletedFrame, "control">
    | undefined;

  /**
   * Redraw the current handled frame through its original producer and complete that draw synchronously.
   *
   * @evidence contracts/common.md#principled-implementation Explicit redraw delegates to the same producer that owns the handled frame and mount checks that a completion was published.
   * @evidence contracts/common.md#clear-and-simple-design The mount supplies preserved clock/control while the producer retains its composite render sequence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Redraw does not substitute the nominal scene for an unobserved composite or silently accept a producer that fails to complete.
   * @evidence contracts/common.md#meaningful-documentation The member states original-producer redraw and synchronous completion responsibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This redraw capability chooses no multipass or guide rendering strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Redraw is an individual render effect under the current completed clock and cannot be cached by matching options.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The callback borrows its producer's resources; that producer owns pass restoration and mount owns renderer/loop lifetime.
   */
  redrawCompleted?: () => void;
}
