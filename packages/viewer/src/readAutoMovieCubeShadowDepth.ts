import type * as THREE from "three";

import {restoreAutoMovieRenderModeState} from "./restoreAutoMovieRenderModeState.js";
import {captureAutoMovieFramebufferRestore} from "./captureAutoMovieFramebufferRestore.js";

/**
 * Read a native cube shadow target's owned depth handle through its framebuffer.
 * The target is a retained shadow draw resource, not an unallocated authored
 * target. The SDK exposes shadow maps as generic RenderTarget values; observe
 * their WebGL identity before binding rather than asserting a cube subtype's
 * unrelated texture-array type. Native queries avoid private properties. Restore
 * the caller's target, face and mip even when binding or the query fails.
 * A depth version of zero proves that this r186 native product has never been
 * initialized, so refuse before binding can allocate it. A positive version
 * is not upload evidence: the retained-draw, exact-context precondition remains
 * the caller's responsibility, including after CPU needsUpdate assignments.
 */
export const readAutoMovieCubeShadowDepth=(renderer:THREE.WebGLRenderer,target:THREE.RenderTarget):WebGLTexture|null=>{
  if(!("isWebGLRenderTarget" in target) || target.isWebGLRenderTarget!==true)
    throw new Error("A retained cube shadow target must be a native WebGL render target.");
  if(target.depthTexture!==null && target.depthTexture.version===0)
    throw new Error("An uninitialized cube depth cannot be queried as a retained native shadow draw product.");
  const restore=captureAutoMovieFramebufferRestore(renderer);
  const gl=renderer.getContext();
  let handle:WebGLTexture|null=null;
  let failure:{error:unknown}|undefined;
  try{
    renderer.setRenderTarget(target as THREE.WebGLRenderTarget,0,0);
    if(gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE)===gl.TEXTURE)
      handle=gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME) as WebGLTexture|null;
  }catch(error){failure={error};}
  if(failure===undefined)restoreAutoMovieRenderModeState([restore]);
  else restoreAutoMovieRenderModeState([restore],failure);
  return handle;
};
