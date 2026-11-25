/**
 * Cost and quality tier of one render job over a shared builder-owned edit.
 *
 * `normalizeRenderTier` admits exactly two shapes: the final tier with scale 1
 * and step 1, and a proxy that reduces at least one of the two. A proxy keeps
 * the edit and its runtime, so the timeline length must be a multiple of
 * `frameStep`; `resolveProductionRenderTierFrameFormat` projects the source
 * raster and clock through it.
 */
export interface IAutoMovieProductionRenderTier {
  /** Tier name, used in chunk slots and publication paths. */
  kind: "proxy" | "final";

  /** Raster multiplier in `(0, 1]`; exactly 1 at the final tier. */
  resolutionScale: number;

  /**
   * Render every Nth timeline frame; an integer from 1 through 16, exactly 1 at
   * the final tier.
   */
  frameStep: number;
}
