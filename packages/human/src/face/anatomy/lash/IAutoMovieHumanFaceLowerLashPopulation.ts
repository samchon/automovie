import type { IAutoMovieHumanFaceLowerLashProfile } from "./IAutoMovieHumanFaceLowerLashProfile";

/**
 * Authored lower-lid shaft geometry with an independent explicit population.
 *
 * Count includes zero and is independent of the upper lid and of source-card
 * area or vertex count. The lower profile retains its mirrored angular frame
 * and conventional envelopes. Roots sample the registered anterior lower row
 * evenly by arc length; this is not a measured lower-follicle distribution.
 *
 * @evidence contracts/common.md#principled-implementation The discrete lower population remains independent of the upper population and continuous shaft profile.
 * @evidence contracts/common.md#clear-and-simple-design One extension of the lower strand's existing profile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No upper/lower ratio or source-card count supplies a missing number.
 * @evidence contracts/common.md#meaningful-documentation States zero, independent ownership, frame and qualification.
 * @evidence contracts/modeling.md#parameter-channels Count controls population; the inherited lower dimensions control free shafts.
 * @evidence contracts/modeling.md#emitted-geometry Each requested shaft takes the common fixed tube resolution.
 * @evidence contracts/modeling.md#spatial-conventions Count is dimensionless; inherited millimetres and degrees use the lower live root frame.
 * @evidence contracts/anatomy.md#anatomical-source Counts and uniform spacing are authored conventions; the 2024 Kerbiriou, Avril and Marchal study reports different lower distributions and does not calibrate these inputs.
 * @evidence contracts/anatomy.md#permitted-range The generator refuses shaft overlaps and tissue penetration; [0,1024] is a rendering resource envelope, not a clinical interval.
 * @evidence contracts/anatomy.md#parametric-authority Numerical count and named shaft dimensions introduce no personal strands or curves.
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
