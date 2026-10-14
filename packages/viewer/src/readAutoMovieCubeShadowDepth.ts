import type * as THREE from "three";

import { captureAutoMovieFramebufferRestore } from "./captureAutoMovieFramebufferRestore.js";
import { restoreAutoMovieRenderModeState } from "./restoreAutoMovieRenderModeState.js";

/**
 * Read a native cube shadow target's owned depth handle through its framebuffer. The target is a retained shadow draw resource, not an unallocated authored target. The SDK exposes shadow maps as generic RenderTarget values; observe their WebGL identity before binding rather than asserting a cube subtype's unrelated texture-array type. Native queries avoid private properties. Restore the caller's target, face and mip even when binding or the query fails. A depth version of zero proves that this r186 native product has never been initialized, so refuse before binding can allocate it. A positive version is not upload evidence: the retained-draw, exact-context precondition remains the caller's responsibility, including after CPU needsUpdate assignments.
 *
 * @evidence contracts/common.md#principled-implementation Requires an actual retained native render-target marker and rejects zero depth version before binding face0/mip0 to query a texture depth attachment through public WebGL APIs.
 * @evidence contracts/common.md#clear-and-simple-design Native attachment observation uses the existing framebuffer snapshot/independent restoration owner rather than SDK private texture properties.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive version alone is not upload proof and CPU needsUpdate can increment it; caller must supply the retained draw product in its exact live context, and absent/nontexture depth returns null.
 * @evidence contracts/common.md#meaningful-documentation Documents generic SDK target typing, initialization refusal, retained-context premise and target/face/mip plus raster restoration on failure.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of native binds/attachment queries and state restores avoids scene/pixel traversal, though native getParameter/query boundaries may synchronize with the driver.
 * @evidence contracts/performance.md#reuse-equivalent-work Each query observes the current attachment and restores one captured state; no earlier WebGLTexture handle is cached as authority for another target/context.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No target or texture is allocated by the intended retained-product path; renderer/target remain borrowed and independently restored, while any violated initialization premise can still trigger SDK allocation on bind.
 */
export const readAutoMovieCubeShadowDepth: (
  renderer: THREE.WebGLRenderer,
  target: THREE.RenderTarget,
) => WebGLTexture | null = (
  renderer: THREE.WebGLRenderer,
  target: THREE.RenderTarget,
): WebGLTexture | null => {
  if (!("isWebGLRenderTarget" in target) || target.isWebGLRenderTarget !== true)
    throw new Error(
      "A retained cube shadow target must be a native WebGL render target.",
    );
  if (target.depthTexture !== null && target.depthTexture.version === 0)
    throw new Error(
      "An uninitialized cube depth cannot be queried as a retained native shadow draw product.",
    );
  const restore: () => void = captureAutoMovieFramebufferRestore(renderer);
  const gl: ReturnType<THREE.WebGLRenderer["getContext"]> =
    renderer.getContext();
  let handle: WebGLTexture | null = null;
  let failure: { error: unknown } | undefined;
  try {
    renderer.setRenderTarget(target as THREE.WebGLRenderTarget, 0, 0);
    if (
      gl.getFramebufferAttachmentParameter(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE,
      ) === gl.TEXTURE
    )
      handle = gl.getFramebufferAttachmentParameter(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME,
      ) as WebGLTexture | null;
  } catch (error) {
    failure = { error };
  }
  if (failure === undefined) restoreAutoMovieRenderModeState([restore]);
  else restoreAutoMovieRenderModeState([restore], failure);
  return handle;
};
