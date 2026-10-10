import type { IPortraitEyelashProfile } from "./IPortraitEyelashProfile";

/**
 * Authored upper-lid shaft geometry and its explicit emitted population.
 *
 * The seven geometric fields retain the strand profile's units and authored
 * envelopes. Count is the requested number of free shafts, including zero;
 * it is independent of source-card vertices and does not claim a measured
 * follicle population. The generator samples the registered anterior root
 * row evenly by arc length. No personal strand or vertex can be addressed.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceUpperLashPopulation extends IPortraitEyelashProfile {
  /** Requested shaft count, an integer in [0,1024]; this is a rendering budget. */
  strandCount: number;

  /** Initial tangent angle from globe-to-root forward toward the live local superior direction, in degrees. */
  elevation: number;

  /** Total tangent turn toward the live local superior direction, in degrees. */
  curl: number;

  /** Medial/lateral spread in the live tangent frame, in degrees; it retains the profile's side convention. */
  fan: number;
}
