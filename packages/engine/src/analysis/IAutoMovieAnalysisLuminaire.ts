import { IAutoMovieVector3 } from "@automovie/interface";

/**
 *
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
 * @evidence contracts/common.md#principled-implementation An isotropic point source: illuminance follows the inverse square law times the cosine of incidence on the workplane, and occlusion is a segment test against convex solids up to the fitting.
 * @evidence contracts/common.md#clear-and-simple-design Position and one intensity without a photometric distribution, because the solver models only isotropic points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A fitting closer than 1e-12 m to a sample is skipped with one warning per luminaire, the inverse-square singularity rather than a tuned threshold.
 * @evidence contracts/common.md#meaningful-documentation States the candela unit, the isotropy, the illuminance contribution with occlusion, and the coincident-fitting warning.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record; its per-point cost, one ray test against every solid, belongs to the daylight analyzer. Read by one daylight study; the set that deduplicates its coincidence warning lives only for that study. An id, a position and an intensity owned by the request for one study.
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
