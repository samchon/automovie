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
 * @evidence contracts/common.md#principled-implementation Screen-size-aware LOD: the camera distance is scaled by the ratio of a 24 pixel reference to the projected diameter, then tiers are matched by ascending threshold, so a first selection is monotone in effective distance, and a fractional hysteresis band around the previous tier keeps later selections stable under jitter.
 * @evidence contracts/common.md#clear-and-simple-design Five members: the tiers, the two measurements, the previous choice for hysteresis and the optional band width, so the selector is a pure function with no hidden frame state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The selector does not recheck the tier order, relying on production design validation that refuses a non-final unbounded tier or a non-increasing threshold; no tier name or camera is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the scaling law and its 24 pixel neutral point, the ordering premise and who guarantees it, the empty-list throw, the meter and pixel units, the clamp below one pixel, and the 0.1 default band.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Input record; the selector's two linear scans over the few LOD tiers are answered on `selectFormationLod`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per selection by the viewer from the current camera; the previous tier is the only carried state and is passed in explicitly rather than cached.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References the compiled formation's tier array without copying it, plus three numbers; the viewer frame that builds it owns it.
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
