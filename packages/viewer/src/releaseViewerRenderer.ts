import type * as THREE from "three";

import {disposeCrossDissolve} from "./disposeCrossDissolve.js";
import {disposeFadeToBlack} from "./disposeFadeToBlack.js";
import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";

/**
 * Release both renderer-owned beauty compositors and the renderer independently.
 * A failed resource listener cannot prevent another owner from releasing its
 * resources. Preserve every failure rather than reporting successful cleanup.
 * Compositor release is idempotent; renderer disposal follows its native API.
 * Direct capture hosts retire their scene shadow targets before this call;
 * mounted hosts use releaseMountedViewer for that complete lifecycle.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Attempts every renderer-owned beauty and native renderer release even after an independent resource failure.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Preserves all cleanup failures without retaining later compositor lifetimes.
 */
export const releaseViewerRenderer=(renderer:THREE.WebGLRenderer):void=>restoreAutoMovieRenderModeState([
  ()=>{disposeCrossDissolve(renderer);},
  ()=>{disposeFadeToBlack(renderer);},
  ()=>{renderer.dispose();},
]);
