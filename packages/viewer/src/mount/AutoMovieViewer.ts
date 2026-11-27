import type * as THREE from "three";
import type { AutoMovieViewerDisplay } from "../display/AutoMovieViewerDisplay";

import { mountViewer } from "./internal/mountViewer";
import { releaseMountedViewer } from "./internal/releaseMountedViewer";

/** Owns the imperative browser viewer's mount and renderer retirement lifecycle. */
export namespace AutoMovieViewer {
  /**
   * Handle returned by {@link AutoMovieViewer.mount}; call `stop()` to end the loop and
   * release the renderer, including any dissolve GPU state the frames created.
   */
  export interface IHandle {
    /** Renderer allocated by this mount and shared with the host's explicit draws. */
    renderer: THREE.WebGLRenderer;

    /**
     * Publish immediately after this handle's original external draw completes.
     * Optional seconds are that draw's actual playback time; a guide redraw
     * preserves the completed clock when no new time is supplied.
     */
    completeFrame: (elapsedSeconds?: number) => void;

    /**
     * Stop the mounted loop and attempt each owned shadow, compositor and
     * renderer retirement; cleanup failures propagate.
     */
    stop: () => void;
  }

  /**
   * Context creation and original-producer completion settings for one mounted
   * viewer. These values configure output conditions; they do not independently
   * certify cross-hardware pixel equality or actual rendered appearance.
   */
  export interface IMountOptions {
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
      | Omit<AutoMovieViewerDisplay.ICompletedFrame, "control">
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
  /** Produce one frame and optionally report that drawing is complete. */
  export type FrameProducer =
    | ((elapsedSeconds: number) => boolean)
    | ((elapsedSeconds: number) => void);

  /**
   * Mount a render loop on a canvas and return its controls. `onFrame` runs
   * once per animation frame; return `true` when it handled drawing itself.
   * Calling the returned handle's `stop()` releases the loop, scene shadow
   * products and renderer.
   */
  export function mount(
    canvas: HTMLCanvasElement,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    onFrame: FrameProducer,
    options?: IMountOptions,
  ): IHandle {
    return mountViewer(canvas, scene, camera, onFrame, options);
  }

  /**
   * End a loop, its native scene shadow products and owned renderer. The loop
   * must stop scheduling first; geometry and materials remain caller-owned.
   */
  export function release(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    stopLoop: () => void,
  ): void {
    releaseMountedViewer(renderer, scene, stopLoop);
  }
}
