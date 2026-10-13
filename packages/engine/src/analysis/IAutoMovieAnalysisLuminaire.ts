import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One artificial source, as a point radiating equally in every direction.
 *
 * Intensity is declared in candela by the production. Shipping a luminaire
 * catalogue would be shipping content; what the engine owes is the inverse
 * square law and the occlusion test, both of which are the same for every
 * fitting anyone ever specifies.
 */
export interface IAutoMovieAnalysisLuminaire {
  /** Stable luminaire identity within the request. */
  id: string;
  /** World position in metres. */
  position: IAutoMovieVector3;
  /** Luminous intensity in candela; at or above zero. */
  intensity: number;
}
