/**
 * What a capture host reports about the graphics context it drew through.
 *
 * The shape a Playwright/WebGL probe answers with, not a renderer identity:
 * `renderer` is WebGL's own spelling of the device string, and the render
 * target calls the same field `device`. Naming both here is what keeps the
 * translation in one place instead of at every call site.
 *
 * @evidence contracts/common.md#principled-implementation The host probe reports API, vendor and renderer spellings; the renderer field is intentionally distinct from the target's device spelling until projection.
 * @evidence contracts/common.md#clear-and-simple-design This boundary type represents the graphics observation without claiming it has already become a sealed render target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Masked vendor and renderer values remain host observations rather than invented device capabilities.
 * @evidence contracts/common.md#meaningful-documentation Members identify WebGL unmasked constants, their masked fallbacks and the API family string.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The graphics observation schema declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The observed device-string identity describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased graphics identity allocates no WebGL context; callers supply descriptive renderer strings and autoMovieRenderTargetRendererOfGraphics projects them into target identity without owning the host context.
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
