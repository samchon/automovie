import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/**
 * Inputs to the deterministic automatic formation LOD selector.
 *
 * `selectFormationLod` scales `distance` by `24 / max(1, projectedPixels)` and
 * takes the first tier whose `maxDistance` is null or covers that value, the
 * last tier when none does. Production design validation guarantees tiers in
 * strictly ascending `maxDistance` with only the final tier unbounded; the
 * selector relies on that order without rechecking it and throws on an empty
 * list.
 *
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
