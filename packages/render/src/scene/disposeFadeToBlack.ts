import type * as THREE from "three";

import { AutoMovieFadeCompositorState as states } from "./AutoMovieFadeCompositorState.js";

/**
 * Release one renderer's fade resources with the compositor's shared outcome.
 * Only successful disposal removes its registry entry. A failed owner remains
 * closed and retained until renderer lifetime ends; later draws cannot reopen
 * it.
 */
export const disposeFadeToBlack: (renderer: THREE.WebGLRenderer) => void = (
  renderer: THREE.WebGLRenderer,
): void => {
  const state: ReturnType<typeof states.get> = states.get(renderer);
  if (state === undefined) return;
  state.dispose();
  states.delete(renderer);
};
