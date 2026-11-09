/**
 * Cost and quality tier of one render job over a shared builder-owned edit.
 *
 * `normalizeRenderTier` admits exactly two shapes: the final tier with scale 1
 * and step 1, and a proxy that reduces at least one of the two. A proxy keeps
 * the edit and its runtime, so the timeline length must be a multiple of
 * `frameStep`; `resolveProductionRenderTierFrameFormat` projects the source
 * raster and clock through it.
 *
 * @evidence contracts/development/design.md#principled-representation Two independent reductions, a raster scale and an integer frame decimation, describe every cheaper rendering of the same edit while keeping its runtime exact, because decimating by a divisor of the frame count divides the rational frame rate by the same integer.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tier is three plain fields, and its admission and its projection live in `normalizeRenderTier` and `resolveProductionRenderTierFrameFormat`, so the record carries no behavior.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The limits of 1 for final and 16 for the proxy step come from the production design's `renderTiers` contract, and no other value is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation The doc names the two admitted shapes and their validator, the divisibility rule with its reason, and the projection, and each member gives its range and its final value.
 */
export interface IAutoMovieProductionRenderTier {
  /** Tier name, used in chunk slots and publication paths. */
  kind: "proxy" | "final";

  /** Raster multiplier in `(0, 1]`; exactly 1 at the final tier. */
  resolutionScale: number;

  /**
   * Render every Nth timeline frame; an integer from 1 through 16, exactly 1
   * at the final tier.
   */
  frameStep: number;
}
