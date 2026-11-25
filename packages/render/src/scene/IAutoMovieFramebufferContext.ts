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
