import type * as THREE from "three";

import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Release the renderer, preserving its failure rather than reporting successful
 * cleanup. The fade and dissolve compositors belong to their owner
 * (`AutoMovieTransitionDisplays`), which releases them in its own `dispose`.
 * Direct capture hosts retire their scene shadow targets before this call;
 * mounted hosts use releaseMountedViewer for that complete lifecycle.
 */
export const releaseViewerRenderer: (renderer: THREE.WebGLRenderer) => void = (
  renderer: THREE.WebGLRenderer,
): void =>
  restoreAutoMovieRenderModeState([
    (): void => {
      renderer.dispose();
    },
  ]);
