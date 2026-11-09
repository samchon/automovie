/**
 * What a capture host reports about the graphics context it drew through.
 *
 * The shape a Playwright/WebGL probe answers with, not a renderer identity:
 * `renderer` is WebGL's own spelling of the device string, and the render
 * target calls the same field `device`. Naming both here is what keeps the
 * translation in one place instead of at every call site.
 *
 * @evidence contracts/development/design.md#principled-representation The host probe reports API, vendor and renderer spellings; the renderer field is intentionally distinct from the target's device spelling until projection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This boundary type represents the graphics observation without claiming it has already become a sealed render target.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Masked vendor and renderer values remain host observations rather than invented device capabilities.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify WebGL unmasked constants, their masked fallbacks and the API family string.
 */
export interface IAutoMovieRenderGraphicsIdentity {
  /**
   * Graphics API family the context reported, such as `webgl2`.
   */
  api: string;

  /**
   * `UNMASKED_VENDOR_WEBGL`, or the plain `VENDOR` when it is masked.
   */
  vendor: string;

  /**
   * `UNMASKED_RENDERER_WEBGL`, or the plain `RENDERER` when it is masked.
   */
  renderer: string;
}
