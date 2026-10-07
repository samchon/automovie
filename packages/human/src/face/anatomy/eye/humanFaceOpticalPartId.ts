import type { AutoMovieHumanFaceOpticalSurface } from "./AutoMovieHumanFaceOpticalSurface";

/**
 * Stable generated identity shared by optical emission and asset readers.
 * The person assembly supplies its existing face prefix at its own boundary.
 * This vocabulary identifies generated surfaces, not a guessed source asset.
 *
 * @evidence contracts/common.md#principled-implementation Emission and actual-asset measurement use the same semantic identity function.
 * @evidence contracts/common.md#clear-and-simple-design One name owner, with the person prefix owned separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh is selected from a familiar asset name.
 * @evidence contracts/common.md#meaningful-documentation States generated identity and prefix responsibilities.
 * @evidence contracts/modeling.md#part-identity-and-grouping Names one generated optical surface of one anatomical side.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Names contain no coordinate or length.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Names establish no measured anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping control.
 */
export function humanFaceOpticalPartId(
  side: "left" | "right",
  surface: AutoMovieHumanFaceOpticalSurface,
): string {
  return "optics:" + side + ":" + surface;
}
