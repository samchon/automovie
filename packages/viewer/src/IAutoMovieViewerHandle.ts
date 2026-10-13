import type * as THREE from "three";

/**
 * Handle returned by {@link mountViewer}; call `stop()` to end the loop and
 * release the renderer, including any dissolve GPU state the frames created.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Exposes the mounted renderer and its matching release operation.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Keeps viewer runtime ownership and cleanup explicit.
 * @author Samchon
 */
export interface IAutoMovieViewerHandle {
  /**
   * Renderer allocated by this mount and shared with the host's explicit draws.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Identifies the renderer resource owned by this viewer handle.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Keeps the runtime resource inside its explicit ownership boundary.
   */
  renderer: THREE.WebGLRenderer;

  /**
   * Publish immediately after this handle's original external draw completes.
   * Optional seconds are that draw's actual playback time; a guide redraw
   * preserves the completed clock when no new time is supplied.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Joins explicit owned draws to the same mounted completion lifecycle.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Supplies completion timing without a second render or shared global pipeline.
   */
  completeFrame: (elapsedSeconds?: number) => void;

  /**
   * Stop the mounted loop and attempt each owned shadow, compositor and renderer retirement; cleanup failures propagate.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Releases the loop and every resource owned by this handle.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Closes the viewer's explicit runtime ownership boundary.
   */
  stop: () => void;
}

