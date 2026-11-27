import { type IAutoMovieRenderFramebufferRenderer } from "./IAutoMovieRenderFramebufferRenderer.js";
import { captureAutoMovieFramebufferRestore as captureAutoMovieFramebufferRestoreImplementation } from "./internal/captureAutoMovieFramebufferRestore.js";
import type * as THREE from "three";
import { readAutoMovieDisplayDestinationEncoding as readDestinationEncodingImplementation } from "./internal/readAutoMovieDisplayDestinationEncoding.js";

/** Public operations for Auto Movie Scene Framebuffer. */
export namespace AutoMovieRenderSceneFramebuffer {
  /**
   * Capture the public framebuffer selection and raster rectangle state. A target
   * bind changes effective viewport/scissor. Preserve both configured logical
   * renderer fields and the effective framebuffer's physical rectangle. A
   * temporary target rectangle supplies the captured physical values to the
   * supported bind operation, then its authored fields are restored immediately.
   * Every independent restoration is attempted after a native resource
   * operation.
   */
  export function captureRestore(renderer: IAutoMovieRenderFramebufferRenderer): (() => void) {
    return captureAutoMovieFramebufferRestoreImplementation(renderer);
  }
  /**
   * Read the actual selected offscreen color attachment's native transfer. The
   * caller has bound its destination, so explicit internal formats and SDK
   * storage choices are observed rather than inferred from Texture.colorSpace.
   * Byte-product emission supports linear or sRGB storage; an absent or unknown
   * color attachment refuses before a source callback can replace the display.
   * The selected face and mip must form a complete framebuffer: a native color
   * encoding alone cannot prove that the selected image storage exists. The float
   * quad requires unsigned-normalized RGBA channels of at least eight bits, or
   * homogeneous RGBA16F/RGBA32F storage. Integer and signed components, missing
   * channels and lower precision cannot certify the byte identities. Eight
   * unsigned-normalized bits encode all 256 source values. RGBA16F's binary16
   * rounding changes a normalized byte value by less than 0.063 byte; RGBA32F is
   * finer, so nearest-byte capture retains those same values. This query neither
   * binds nor allocates a target and changes no native state. The installed
   * renderer declaration also admits a WebGL1 context, so the WebGL2 member of
   * that declared union is selected before its attachment-query constants are
   * read; no guessed numeric enum or widened type substitutes. That selection is
   * a capability probe of the host's runtime WebGL context, not a type check of
   * AutoMovie data, so it reads the context's own member with `in`.
   */
  export function readDestinationEncoding(
    renderer: Pick<THREE.WebGLRenderer, "getContext">,
  ): "linear" | "srgb" {
    return readDestinationEncodingImplementation(renderer);
  }
}
