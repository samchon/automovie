import type * as THREE from "three";

import { AutoMovieDissolveCompositorState as states } from "./AutoMovieDissolveCompositorState.js";

/**
 * Release renderer-owned dissolve copies and quad resources once. Success
 * removes the entry so a later dissolve can acquire a fresh compositor; failure
 * retains the closed owner and its original completion, refusing further draws.
 */
export const disposeCrossDissolve: (renderer: THREE.WebGLRenderer) => void = (
  renderer: THREE.WebGLRenderer,
): void => {
  const state: ReturnType<typeof states.get> = states.get(renderer);
  if (state === undefined) return;
  state.dispose();
  states.delete(renderer);
};
