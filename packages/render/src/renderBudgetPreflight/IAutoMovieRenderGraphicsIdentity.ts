


/**
 * What a capture host reports about the graphics context it drew through.
 *
 * The shape a Playwright/WebGL probe answers with, not a renderer identity:
 * `renderer` is WebGL's own spelling of the device string, and the render
 * target calls the same field `device`. Naming both here is what keeps the
 * translation in one place instead of at every call site.
 *
 * @author Samchon
 */
export interface IAutoMovieRenderGraphicsIdentity {
  /**
   * Graphics API family the context reported, such as `webgl2`.
   *
   * @author Samchon
   */
  api: string;

  /**
   * `UNMASKED_VENDOR_WEBGL`, or the plain `VENDOR` when it is masked.
   *
   * @author Samchon
   */
  vendor: string;

  /**
   * `UNMASKED_RENDERER_WEBGL`, or the plain `RENDERER` when it is masked.
   *
   * @author Samchon
   */
  renderer: string;
}
