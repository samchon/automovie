import type * as THREE from "three";

/**
 * Handle returned by {@link mountViewer}; call `stop()` to end the loop and
 * release the renderer, including any dissolve GPU state the frames created.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerHandle {
  /**
   * Renderer allocated by this mount and shared with the host's explicit draws.
   */
  renderer: THREE.WebGLRenderer;

  /**
   * Publish immediately after this handle's original external draw completes.
   * Optional seconds are that draw's actual playback time; a guide redraw
   * preserves the completed clock when no new time is supplied.
   */
  completeFrame: (elapsedSeconds?: number) => void;

  /**
   * Stop the mounted loop and attempt each owned shadow, compositor and renderer retirement; cleanup failures propagate.
   */
  stop: () => void;
}

