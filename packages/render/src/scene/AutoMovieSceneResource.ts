import type * as THREE from "three";
import { releaseViewerRenderer as releaseViewerRendererImplementation } from "./internal/releaseViewerRenderer.js";

/** Public operations for Auto Movie Scene Resource. */
export namespace AutoMovieSceneResource {
  /**
   * Release the renderer, preserving its failure rather than reporting successful
   * cleanup. The fade and dissolve compositors belong to their owner
   * (`AutoMovieTransitionDisplays`), which releases them in its own `dispose`.
   * Direct capture hosts retire their scene shadow targets before this call;
   * mounted hosts use releaseMountedViewer for that complete lifecycle.
   */
  export function releaseRenderer(renderer: THREE.WebGLRenderer): void {
    releaseViewerRendererImplementation(renderer);
  }
}
