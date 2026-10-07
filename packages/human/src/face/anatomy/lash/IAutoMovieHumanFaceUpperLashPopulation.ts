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
 * @evidence contracts/common.md#principled-implementation Separates the discrete population from each shaft's continuous profile.
 * @evidence contracts/common.md#clear-and-simple-design Extends the existing strand profile with one population quantity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default count or card-to-follicle inference.
 * @evidence contracts/common.md#meaningful-documentation States zero, root distribution and the distinction from clinical counts.
 * @evidence contracts/modeling.md#parameter-channels Strand count controls population independently from length, radius, curl and fan.
 * @evidence contracts/modeling.md#emitted-geometry Each requested shaft takes the strand owner's fixed regular tube resolution.
 * @evidence contracts/modeling.md#spatial-conventions Count is dimensionless; inherited lengths are millimetres and angles degrees in the live root frame.
 * @evidence contracts/anatomy.md#anatomical-source Authored count and uniform root spacing are conventions, without copying the fitted participant distributions of Kerbiriou, Avril and Marchal 2024, Computer Graphics Forum 43(2):e15040.
 * @evidence contracts/anatomy.md#permitted-range The attached generator refuses overlapping shafts and tissue penetration; count's resource envelope is not a normative follicle interval.
 * @evidence contracts/anatomy.md#parametric-authority One numerical shaft count and the existing named dimensions; no personal root curve or per-strand data.
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
