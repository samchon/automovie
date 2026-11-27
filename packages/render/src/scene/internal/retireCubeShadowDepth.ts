import type { IAutoMovieRenderFramebufferContext } from "../IAutoMovieRenderFramebufferContext";
import type { IAutoMovieRenderFramebufferRenderer } from "../IAutoMovieRenderFramebufferRenderer";
import { captureFramebufferRestore } from "./captureFramebufferRestore";
import { restoreRenderModeState } from "./restoreRenderModeState";

/*
 * Release a still-live owned cube depth handle after native target disposal.
 * Three r186 allocates cube depth outside its source-upload cache, so public
 * Texture.dispose can clear SDK bookkeeping while leaving this allocation.
 * Check the native lifetime first: an SDK that already released it needs no
 * supplemental delete. Public resetState reconciles native bindings, then the
 * caller's separate target, face and mip are restored independently.
 */
export const retireCubeShadowDepth: (
  renderer: IAutoMovieRenderFramebufferRenderer,
  handle: WebGLTexture,
) => void = (
  renderer: IAutoMovieRenderFramebufferRenderer,
  handle: WebGLTexture,
): void => {
  const restore: () => void = captureFramebufferRestore(renderer);
  const gl: IAutoMovieRenderFramebufferContext = renderer.getContext();
  restoreRenderModeState([
    (): void => {
      if (gl.isTexture(handle)) gl.deleteTexture(handle);
    },
    (): void => {
      renderer.resetState();
    },
    restore,
  ]);
};
