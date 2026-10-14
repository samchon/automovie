import type * as THREE from "three";

import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import {captureAutoMovieFramebufferRestore} from "./captureAutoMovieFramebufferRestore.js";

/**
 * Release a still-live owned cube depth handle after native target disposal. Three r186 allocates cube depth outside its source-upload cache, so public Texture.dispose can clear SDK bookkeeping while leaving this allocation. Check the native lifetime first: an SDK that already released it needs no supplemental delete. Public resetState reconciles native bindings, then the caller's separate target, face and mip are restored independently.
 *
 * @evidence contracts/common.md#principled-implementation Captures current public framebuffer/raster state, deletes the still-live owned native cube depth handle only if isTexture confirms it and independently resets SDK binding state then restores the caller snapshot.
 * @evidence contracts/common.md#clear-and-simple-design Supplemental native cube depth cleanup stays separate from target/Texture public disposal and uses the shared framebuffer restoration policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only an owned exact-context handle from a retained draw is admissible; a native handle already deleted needs no second delete and public API completion is not independent GPU/kernel release proof.
 * @evidence contracts/common.md#meaningful-documentation Documents installed-r186 cube cache distinction, still-live check, resetState reconciliation and caller target/face/mip restoration.
 * @evidence contracts/performance.md#efficient-algorithms Fixed native lifetime/delete/reset/state-restoration calls use constant coordinator storage without scene or depth-pixel scanning.
 * @evidence contracts/performance.md#reuse-equivalent-work isTexture avoids repeating a completed native delete in this call; each actual handle/state snapshot is observed anew and not reused across contexts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function acquires no target or texture, independently attempts delete/reset/restore and leaves renderer/caller destination borrowed; the owning shadow/context boundary retains any failed release uncertainty.
 */
export const retireAutoMovieCubeShadowDepth: (renderer: THREE.WebGLRenderer, handle: WebGLTexture) => void=(renderer:THREE.WebGLRenderer,handle:WebGLTexture):void=>{
  const restore: () => void=captureAutoMovieFramebufferRestore(renderer);
  const gl: ReturnType<THREE.WebGLRenderer["getContext"]>=renderer.getContext();
  restoreAutoMovieRenderModeState([
    (): void =>{if(gl.isTexture(handle))gl.deleteTexture(handle);},
    (): void =>{renderer.resetState();},
    restore,
  ]);
};
