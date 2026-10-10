import type { IAutoMovieHumanFaceLowerLashProfile } from "./IAutoMovieHumanFaceLowerLashProfile";

/**
 * Authored lower-lid shaft geometry with an independent explicit population.
 *
 * Count includes zero and is independent of the upper lid and of source-card
 * area or vertex count. The lower profile retains its mirrored angular frame
 * and conventional envelopes. Roots sample the registered anterior lower row
 * evenly by arc length; this is not a measured lower-follicle distribution.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLowerLashPopulation extends IAutoMovieHumanFaceLowerLashProfile {
  /** Requested shaft count, an integer in [0,1024]; this is a rendering budget. */
  strandCount: number;

  /** Initial tangent angle from globe-to-root forward toward live local inferior, in degrees. */
  elevation: number;

  /** Total tangent turn toward live local inferior, in degrees; negative values curve toward superior. */
  curl: number;

  /** Medial/lateral spread in the live tangent frame, in degrees, independent from upper fan. */
  fan: number;
}
