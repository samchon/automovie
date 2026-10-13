import type * as THREE from "three";
import {AutoMovieFadeCompositorState as states} from "./AutoMovieFadeCompositorState.js";

/**
 * Release renderer-owned fade copies and quad resources. Repeated disposal is
 * safe; a later fade acquires fresh resources for the same renderer.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Releases only the fade compositor's owned GPU resources.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Ends the compositor lifecycle without disposing the caller's renderer.
 */
export const disposeFadeToBlack = (renderer: THREE.WebGLRenderer): void => {
  const state = states.get(renderer);
  if (state === undefined) return;
  states.delete(renderer);
  state.dispose();
};
