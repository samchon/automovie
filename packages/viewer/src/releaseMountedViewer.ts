import type * as THREE from "three";

import {resetAutoMovieSceneShadowTargets} from "./resetAutoMovieSceneShadowTargets.js";
import {releaseViewerRenderer} from "./releaseViewerRenderer.js";
import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";

/**
 * End a mounted loop, its native scene shadow products and owned renderer.
 * Stop scheduling first; shadow retirement still needs the live renderer's
 * context before renderer disposal. Geometry/materials remain caller-owned.
 * These owners release independently even when another listener fails. The
 * shadow owner enforces its exclusive-context and external-borrower boundary.
 */
export const releaseMountedViewer=(renderer:THREE.WebGLRenderer,scene:THREE.Scene,stopLoop:()=>void):void=>restoreAutoMovieRenderModeState([
  stopLoop,
  ()=>{resetAutoMovieSceneShadowTargets(scene,renderer);},
  ()=>{releaseViewerRenderer(renderer);},
]);
