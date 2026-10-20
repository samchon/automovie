/**
 * Cost and quality tier of one render job over a shared builder-owned edit.
 *
 * `normalizeRenderTier` admits exactly two shapes: the final tier with scale 1
 * and step 1, and a proxy that reduces at least one of the two. A proxy keeps
 * the edit and its runtime, so the timeline length must be a multiple of
 * `frameStep`; `resolveProductionRenderTierFrameFormat` projects the source
 * raster and clock through it.
 *
 * @evidence contracts/common.md#principled-implementation Two independent reductions, a raster scale and an integer frame decimation, describe every cheaper rendering of the same edit while keeping its runtime exact, because decimating by a divisor of the frame count divides the rational frame rate by the same integer.
 * @evidence contracts/common.md#clear-and-simple-design The tier is three plain fields, and its admission and its projection live in `normalizeRenderTier` and `resolveProductionRenderTierFrameFormat`, so the record carries no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The limits of 1 for final and 16 for the proxy step come from the production design's `renderTiers` contract, and no other value is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc names the two admitted shapes and their validator, the divisibility rule with its reason, and the projection, and each member gives its range and its final value.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface runs no algorithm; admission and projection costs are answered on their functions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Three tier fields are copied into every chunk identity rather than computed, so no tier-level result exists to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A tier is three scalars with no handle; the plan's `tier` field and each chunk digest input hold copies whose lifetime is the plan's.
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
