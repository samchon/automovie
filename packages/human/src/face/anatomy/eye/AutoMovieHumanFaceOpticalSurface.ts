/**
 * Semantic surfaces emitted by the independent optical assembly.
 * The interior backing is a rendering surface and names no retinal tissue.
 *
 * @evidence contracts/common.md#principled-implementation A closed set identifies the four surfaces produced by the same optical geometry owner.
 * @evidence contracts/common.md#clear-and-simple-design One role vocabulary is shared by emission and final-asset readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generated semantic roles replace no source asset registration.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the rendered backing from anatomical tissue.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Roles have no coordinate or unit.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Identifies surfaces without a measured value.
 * @evidenceExclude contracts/anatomy.md#permitted-range A closed vocabulary, not a physiological interval.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no shaping input.
 */
export type AutoMovieHumanFaceOpticalSurface =
  | "sclera"
  | "cornea"
  | "iris"
  | "apertureBacking";
