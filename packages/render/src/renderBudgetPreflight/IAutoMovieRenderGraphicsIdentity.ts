


/**
 * What a capture host reports about the graphics context it drew through.
 *
 * The shape a Playwright/WebGL probe answers with, not a renderer identity:
 * `renderer` is WebGL's own spelling of the device string, and the render
 * target calls the same field `device`. Naming both here is what keeps the
 * translation in one place instead of at every call site.
 *
 * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderGraphicsIdentity` carries the conservative measurement basis and deterministic budget decision.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderGraphicsIdentity` exposes that responsibility through the package-independent system contract.
 * @author Samchon
 */
export interface IAutoMovieRenderGraphicsIdentity {
  /**
   * Graphics API family the context reported, such as `webgl2`.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderGraphicsIdentity.api` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderGraphicsIdentity.api` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  api: string;

  /**
   * `UNMASKED_VENDOR_WEBGL`, or the plain `VENDOR` when it is masked.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderGraphicsIdentity.vendor` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderGraphicsIdentity.vendor` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  vendor: string;

  /**
   * `UNMASKED_RENDERER_WEBGL`, or the plain `RENDERER` when it is masked.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderGraphicsIdentity.renderer` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderGraphicsIdentity.renderer` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  renderer: string;
}
