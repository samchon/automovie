import type * as THREE from "three";

/**
 * The part of a WebGL context a framebuffer save, a native attachment query and
 * its release read: the scissor state, the bound depth attachment and the
 * liveness and deletion of a texture.
 */
export type IAutoMovieFramebufferContext = Pick<
  WebGLRenderingContext,
  | "SCISSOR_BOX"
  | "SCISSOR_TEST"
  | "FRAMEBUFFER"
  | "DEPTH_ATTACHMENT"
  | "FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE"
  | "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME"
  | "TEXTURE"
  | "getParameter"
  | "isEnabled"
  | "getFramebufferAttachmentParameter"
  | "isTexture"
  | "deleteTexture"
>;

/**
 * The part of a `THREE.WebGLRenderer` a framebuffer save, a native attachment
 * query and its release read and write: the destination, viewport and scissor,
 * the WebGL context and the renderer's cached GL state.
 */
export type IAutoMovieFramebufferRenderer = Pick<
  THREE.WebGLRenderer,
  | "getRenderTarget"
  | "setRenderTarget"
  | "getActiveCubeFace"
  | "getActiveMipmapLevel"
  | "getViewport"
  | "setViewport"
  | "getScissor"
  | "setScissor"
  | "getScissorTest"
  | "setScissorTest"
  | "getCurrentViewport"
  | "resetState"
> & {
  /** The context whose framebuffer and textures the renderer drives. */
  getContext(): IAutoMovieFramebufferContext;
};
