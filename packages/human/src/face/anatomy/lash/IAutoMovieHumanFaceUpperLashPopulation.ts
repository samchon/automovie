import type { IPortraitEyelashProfile } from "./IPortraitEyelashProfile";

/**
 * Authored upper-lid shaft geometry and its explicit emitted population.
 *
 * The seven geometric fields retain the strand profile's units and authored envelopes. Count is the requested number of free shafts, including zero; it is independent of source-card vertices and does not claim a measured follicle population. The generator samples the registered anterior root row evenly by arc length. No personal strand or vertex can be addressed.
 *
 * @evidence contracts/common.md#principled-implementation Explicit requested upper shaft count accompanies the retained geometric profile and live superior frame.
 * @evidence contracts/common.md#clear-and-simple-design The upper pair keeps per-eye population authoring separate from source-card topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arc-length sampling of the registered root row is not a measured follicle population and no personal strand address is exposed.
 * @evidence contracts/common.md#meaningful-documentation Count includes zero and remains an allocation budget; angular fields are degrees and lengths/radius millimetres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms buildHumanFaceLashRows owns sampling and emitted geometry; this type performs no allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Population admission reuses the upper shaft profile validator rather than another set of geometric bounds.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns scalar profile/count records while generated shaft buffers belong to the returned model.
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
