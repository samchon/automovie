import type * as THREE from "three";

import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import {captureAutoMovieFramebufferRestore} from "./captureAutoMovieFramebufferRestore.js";

/**
 * Release a still-live owned cube depth handle after native target disposal.
 * Three r186 allocates cube depth outside its source-upload cache, so public
 * Texture.dispose can clear SDK bookkeeping while leaving this allocation.
 * Check the native lifetime first: an SDK that already released it needs no
 * supplemental delete. Public resetState reconciles native bindings, then the
 * caller's separate target, face and mip are restored independently.
 */
export const retireAutoMovieCubeShadowDepth=(renderer:THREE.WebGLRenderer,handle:WebGLTexture):void=>{
  const restore=captureAutoMovieFramebufferRestore(renderer);
  const gl=renderer.getContext();
  restoreAutoMovieRenderModeState([
    ()=>{if(gl.isTexture(handle))gl.deleteTexture(handle);},
    ()=>{renderer.resetState();},
    restore,
  ]);
};
