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
