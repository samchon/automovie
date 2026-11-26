import { type IAutoMovieFramebufferRenderer } from "./IAutoMovieFramebufferRenderer.js";
import { captureAutoMovieFramebufferRestore as captureAutoMovieFramebufferRestoreImplementation } from "./internal/captureAutoMovieFramebufferRestore.js";

/** Public operations for Auto Movie Scene Framebuffer. */
export namespace AutoMovieSceneFramebuffer {
  /**
   * Capture the public framebuffer selection and raster rectangle state. A target
   * bind changes effective viewport/scissor. Preserve both configured logical
   * renderer fields and the effective framebuffer's physical rectangle. A
   * temporary target rectangle supplies the captured physical values to the
   * supported bind operation, then its authored fields are restored immediately.
   * Every independent restoration is attempted after a native resource
   * operation.
   */
  export function captureRestore(renderer: IAutoMovieFramebufferRenderer): (() => void) {
    return captureAutoMovieFramebufferRestoreImplementation(renderer);
  }
}
