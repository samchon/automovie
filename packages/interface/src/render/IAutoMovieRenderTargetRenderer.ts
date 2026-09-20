/**
 * Renderer identity: what the frame is drawn by.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-identity-collision-corruption Exposes `IAutoMovieRenderTargetRenderer` as the portable data boundary for the rendering identity collision corruption requirement.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Types `IAutoMovieRenderTargetRenderer` for the spec render frame identity system contract.
 */
export interface IAutoMovieRenderTargetRenderer {
  /**
   * Graphics API family, such as `webgl2`.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-identity-collision-corruption Exposes `api` as the portable data boundary for the rendering identity collision corruption requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Types `api` for the spec render frame identity system contract.
   */
  api: string;

  /**
   * Reported hardware vendor, or `unknown` when the host withholds it.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-identity-collision-corruption Exposes `vendor` as the portable data boundary for the rendering identity collision corruption requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Types `vendor` for the spec render frame identity system contract.
   */
  vendor: string;

  /**
   * Reported device or renderer string, or `unknown`.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-identity-collision-corruption Exposes `device` as the portable data boundary for the rendering identity collision corruption requirement.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Types `device` for the spec render frame identity system contract.
   */
  device: string;
}
