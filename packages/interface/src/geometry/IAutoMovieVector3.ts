/**
 * A 3D vector in automovie space (y-up, right-handed; see the package README
 * coordinate convention).
 *
 * Used both for positions / translations (in meters) and for unitless
 * directions (axes, normals). Which one a given field means is documented at
 * that field; the engine range-checks positions where it matters.
 *
 * @evidence contracts/common.md#principled-implementation A plain Cartesian triple in the y-up right-handed frame with +X toward a character's left and +Z toward its front, the glTF convention, so positions export without an axis swap.
 * @evidence contracts/common.md#clear-and-simple-design One shape serves metre positions and unitless directions, with the meaning stated at each field that uses it rather than through separate point and direction types.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No axis or value is special-cased here; finiteness, non-zero length and range checks belong to the validator of the record that holds the vector.
 * @evidence contracts/common.md#meaningful-documentation States the handedness, the up axis, the character-relative meaning of each axis sign, and that unit and range are documented by each using field.
 * @author Samchon
 */
export interface IAutoMovieVector3 {
  /** X: toward the character's left (+) / right (−). */
  x: number;

  /** Y: up (+) / down (−). */
  y: number;

  /** Z: toward the character's front (+) / back (−). */
  z: number;
}
