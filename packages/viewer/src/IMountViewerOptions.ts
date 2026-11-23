import type { IAutoMovieViewerCompletedFrame } from "./IAutoMovieViewerCompletedFrame.js";

/**
 * Context creation and original-producer completion settings for one mounted
 * viewer. These values configure output conditions; they do not independently
 * certify cross-hardware pixel equality or actual rendered appearance.
 */
export interface IMountViewerOptions {
  /**
   * Creation-time multisample antialiasing, true by default; false avoids
   * segment-edge blending without proving cross-GPU byte equality.
   */
  antialias?: boolean;

  /**
   * Fixed canvas pixel ratio; absence follows the current device ratio. Capture
   * hosts pin one for fixed output dimensions. CSS layout owns the logical
   * canvas dimensions.
   */
  pixelRatio?: number;

  /**
   * Creation-time native buffer preservation, false by default; an explicit
   * readback host must choose its required lifetime.
   */
  preserveDrawingBuffer?: boolean;

  /**
   * Return the original handled producer's completed scene/camera/pass, or
   * undefined when it has no completed observation.
   */
  completedFrame?: () =>
    | Omit<IAutoMovieViewerCompletedFrame, "control">
    | undefined;

  /**
   * Redraw the handled frame at the requested seconds through its original
   * producer and complete that draw synchronously. Restore supplies the saved
   * production time; ordinary redraw supplies the last completed time. Refusal
   * throws. Call completeFrame after the draw, or expose a distinct new
   * producer record through completedFrame; retaining the previous record is
   * not completion.
   */
  redrawCompleted?: (elapsedSeconds: number) => void;

  /**
   * Pause an independently owned producer clock/audio for the outermost freeze.
   * Return synchronous cleanup: resume=true on the last normal release and
   * resume=false when the mount stops. Nested freezes share this lease. The
   * mount suppresses animation ticks while frozen; explicit redraw/restore
   * still completes through the original producer. A throwing acquisition owns
   * rollback.
   */
  freezeCompleted?: () => (resume: boolean) => void;
}
