import type * as THREE from "three";

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
  | "getContext"
  | "resetState"
>;
