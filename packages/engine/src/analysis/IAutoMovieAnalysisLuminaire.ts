import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One artificial source, as a point radiating equally in every direction.
 *
 * Intensity is declared in candela by the production. Shipping a luminaire
 * catalogue would be shipping content; what the engine owes is the inverse
 * square law and the occlusion test, both of which are the same for every
 * fitting anyone ever specifies.
 *
 * `analyzeAutoMovieDaylight` adds `I * max(0, dot(n, d)) / r^2` at each
 * workplane point when no solid stands between the fitting and the point. A
 * fitting within 1e-12 m of a sample point contributes nothing there and raises
 * one `luminaire-on-workplane` warning per fitting.
 *
 * @evidence contracts/common.md#principled-implementation An isotropic point source under the inverse square and cosine laws, `I * cos / r^2`, with occlusion tested by the same convex slab test as the sun, which holds for a fitting small against its distance to the plane.
 * @evidence contracts/common.md#clear-and-simple-design Id, position and one intensity, because an isotropic point needs no photometric web or orientation and the engine ships no fitting catalogue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A fitting on the workplane contributes nothing and raises a warning instead of a clamped or infinite value, and no fitting type is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the contribution law, the occlusion rule, the coincidence threshold and its once-per-fitting warning, the candela and metre units, and the non-negative finite intensity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Input record; each fitting costs one occlusion test per grid point inside `analyzeAutoMovieDaylight`, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fitting is read for one study; its occlusion result depends on each sample point, so nothing is shared between points or studies.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An id, a position and a number owned by the request; the analysis records only the warning id it raised.
 * @author Samchon
 */
export interface IAutoMovieAnalysisLuminaire {
  /** Stable luminaire identity, unique among the request's luminaires. */
  id: string;

  /** World position in metres; every axis finite. */
  position: IAutoMovieVector3;

  /** Luminous intensity in candela, equal in every direction; finite, at or above zero. */
  intensity: number;
}
