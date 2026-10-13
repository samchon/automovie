import type * as THREE from "three";
import {AutoMovieFadeCompositorState as states} from "./AutoMovieFadeCompositorState.js";

/**
 * Release renderer-owned fade copies and quad resources. Repeated disposal is
 * safe; a later fade acquires fresh resources for the same renderer.
 */
export const disposeFadeToBlack = (renderer: THREE.WebGLRenderer): void => {
  const state = states.get(renderer);
  if (state === undefined) return;
  states.delete(renderer);
  state.dispose();
};
