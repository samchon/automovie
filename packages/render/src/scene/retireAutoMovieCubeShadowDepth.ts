import type {
  IAutoMovieFramebufferContext,
  IAutoMovieFramebufferRenderer,
} from "./IAutoMovieFramebufferRenderer.js";
import { captureAutoMovieFramebufferRestore } from "./captureAutoMovieFramebufferRestore.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Release a still-live owned cube depth handle after native target disposal.
 * Three r186 allocates cube depth outside its source-upload cache, so public
 * Texture.dispose can clear SDK bookkeeping while leaving this allocation.
 * Check the native lifetime first: an SDK that already released it needs no
 * supplemental delete. Public resetState reconciles native bindings, then the
 * caller's separate target, face and mip are restored independently.
 */
export const retireAutoMovieCubeShadowDepth: (
  renderer: IAutoMovieFramebufferRenderer,
  handle: WebGLTexture,
) => void = (
  renderer: IAutoMovieFramebufferRenderer,
  handle: WebGLTexture,
): void => {
  const restore: () => void = captureAutoMovieFramebufferRestore(renderer);
  const gl: IAutoMovieFramebufferContext = renderer.getContext();
  restoreAutoMovieRenderModeState([
    (): void => {
      if (gl.isTexture(handle)) gl.deleteTexture(handle);
    },
    (): void => {
      renderer.resetState();
    },
    restore,
  ]);
};
