import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 *
 * Inputs to the deterministic automatic formation LOD selector.
 *
 * `selectFormationLod` scales `distance` by `24 / max(1, projectedPixels)` and
 * takes the first tier whose `maxDistance` is null or covers that value, the
 * last tier when none does. Production design validation guarantees tiers in
 * strictly ascending `maxDistance` with only the final tier unbounded; the
 * selector relies on that order without rechecking it and throws on an empty
 * list.
 *
 * @evidence contracts/common.md#principled-implementation Supplies the two inputs of a screen-space LOD metric (camera distance and projected size) plus the previous tier, so the selector can apply a fractional deadband instead of switching at a hard threshold.
 * @evidence contracts/common.md#clear-and-simple-design Takes the retained tier as an input rather than storing it in the engine, so the viewer keeps one tier per chunk and offline measurement passes null with no shared state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 24-pixel neutral size and the 0.1 default deadband are fixed selector constants, not per-production tuning; the selector's non-null assertions on boundary tiers rest on the ascending-order premise rather than a check.
 * @evidence contracts/common.md#meaningful-documentation States the effective-distance formula, the ordering premise on `lod`, the pixel clamp, the meaning of a null or unknown `previous`, and the default deadband.
 * @evidenceExclude contracts/performance.md#cost-and-resources A plain input record; the selector's two `findIndex` scans run over a tier list that names at most `hero`, `near` and `far`. Each input describes one chunk at one frame; the only carried-over fact is `previous`, which the caller owns. References the compiled tier array plus four scalars for one call; the per-chunk previous tier lives in the viewer's chunk record.
 * @author Samchon
 */
export interface IAutoMovieFormationLodInput {
  /**
   * Compiled anonymous representations in strictly ascending `maxDistance`, the
   * unbounded (null) tier last; at least one.
   */
  lod: readonly IAutoMovieCompiledFormationLod[];

  /** Camera-to-chunk-centroid distance in meters. */
  distance: number;

  /**
   * Projected representative-member diameter in physical pixels; values below
   * one count as one, and 24 leaves the distance unscaled.
   */
  projectedPixels: number;

  /**
   * Tier retained from the previous frame, or null on first selection; a tier
   * missing from `lod` is treated as null.
   */
  previous: IAutoMovieCompiledFormationLod["tier"] | null;

  /**
   * Fractional deadband around the boundary between the previous and the
   * desired tier; 0.1 when omitted.
   */
  hysteresis?: number;
}
