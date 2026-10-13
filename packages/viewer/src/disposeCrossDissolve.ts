import type * as THREE from "three";
import {AutoMovieDissolveCompositorState as states} from "./AutoMovieDissolveCompositorState.js";

/**
 * Release renderer-owned display copies and quad resources. Repeated disposal
 * is safe, and the next dissolve acquires a fresh compositor.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Releases compositor resources with the renderer's explicit lifecycle.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Prevents source products surviving an ended renderer lifecycle.
 */
export const disposeCrossDissolve = (renderer: THREE.WebGLRenderer): void => {
  const state = states.get(renderer);
  if (state === undefined) return;
  states.delete(renderer);
  state.dispose();
};
