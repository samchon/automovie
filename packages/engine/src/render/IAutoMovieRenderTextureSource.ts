/**
 * One texture asset's decoded size, used to estimate device memory.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries decoded texture dimensions and mip policy for device-memory estimation.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Defines the texture facts required before preflight may report measured bytes.
 */
export interface IAutoMovieRenderTextureSource {
  /**
   * Project asset id, as a material binding cites it.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Joins decoded dimensions to the exact texture referenced by materials.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prevents texture byte estimates from being attributed to a different asset.
   */
  asset: string;

  /**
   * Decoded width in pixels, a positive integer.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies one dimension of the decoded texel population.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Makes texture-memory accounting depend on stated decoded width.
   */
  width: number;

  /**
   * Decoded height in pixels, a positive integer.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the other dimension of the decoded texel population.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Makes texture-memory accounting depend on stated decoded height.
   */
  height: number;

  /**
   * Whether the renderer uploads a full mip chain. A mipmapped 2D texture costs
   * four thirds of its base level, the geometric series `1 + 1/4 + ...` summed
   * over the chain.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes the full mip-chain multiplier in decoded texture memory.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes base-only and mipmapped upload cost in preflight.
   */
  mipmapped: boolean;
}
