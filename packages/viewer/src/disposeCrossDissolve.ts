import type * as THREE from "three";
import {AutoMovieDissolveCompositorState as states} from "./AutoMovieDissolveCompositorState.js";

/**
 * Release renderer-owned display copies and quad resources. Repeated disposal
 * is safe, and the next dissolve acquires a fresh compositor.
 */
export const disposeCrossDissolve = (renderer: THREE.WebGLRenderer): void => {
  const state = states.get(renderer);
  if (state === undefined) return;
  states.delete(renderer);
  state.dispose();
};
