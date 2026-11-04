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
 */
export interface IMountViewerOptions {
  /** Creation-time multisample antialiasing, true by default; false avoids segment-edge blending without proving cross-GPU byte equality. */
  antialias?: boolean;

  /** Fixed canvas pixel ratio; absence follows the current device ratio. Capture hosts pin one for fixed output dimensions. CSS layout owns the logical canvas dimensions. */
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
   * Redraw the handled frame at the requested seconds through its original
   * producer and complete that draw synchronously. Restore supplies the saved
   * production time; ordinary redraw supplies the last completed time. Refusal
   * throws. Call completeFrame after the draw, or expose a distinct new producer
   * record through completedFrame; retaining the previous record is not completion.
   *
   * @evidence contracts/common.md#principled-implementation Explicit redraw delegates the requested completed seconds to the same producer that owns the handled frame and mount checks that a completion was published. A producer with its own clock restores that clock before drawing.
   * @evidence contracts/common.md#clear-and-simple-design The mount supplies preserved clock/control while the producer retains its composite render sequence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Redraw does not substitute the nominal scene for an unobserved composite or relabel a previous producer record. Explicit completion or a newly exposed producer record must attest the requested time; refusal throws.
   * @evidence contracts/common.md#meaningful-documentation The member states original-producer redraw, requested seconds for restoration versus ordinary redraw, and synchronous completion responsibility.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This redraw capability chooses no multipass or guide rendering strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Redraw is an individual render effect under the current completed clock and cannot be cached by matching options.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The callback borrows its producer's resources; that producer owns pass restoration and mount owns renderer/loop lifetime.
   */
  redrawCompleted?: (elapsedSeconds: number) => void;

  /**
   * Pause an independently owned producer clock/audio for the outermost freeze.
   * Return synchronous cleanup: resume=true on the last normal release and
   * resume=false when the mount stops. Nested freezes share this lease. The
   * mount suppresses animation ticks while frozen; explicit redraw/restore still
   * completes through the original producer. A throwing acquisition owns rollback.
   *
   * @evidence contracts/common.md#principled-implementation Delegates independent clock/audio pause to their actual producer owner and distinguishes resumption from terminal release; mount keeps nested lease accounting and animation suppression.
   * @evidence contracts/common.md#clear-and-simple-design One optional producer lease complements original redraw ownership without making Viewer own media playback or a production clock.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary mount-clock producers need no callback; independently advancing state is paused through its owner rather than a substituted time argument.
   * @evidence contracts/common.md#meaningful-documentation States outermost acquisition, final and terminal release flags, synchronous ownership, nested behavior, explicit draws and failed-acquisition rollback.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback type performs no playback calculation itself.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The controller shares the outer producer lease; this declaration retains no cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A mounted controller retains at most one acquired producer cleanup and consumes it on final release or terminal disposal; the producer owns any async tasks it starts during resumption.
   */
  freezeCompleted?: () => (resume: boolean) => void;
}
