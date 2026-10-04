import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The midpoint of the body's two eye joints, the anchor of the face basis's
 * eye-centred frame, read from a landmark table by id.
 *
 * Refuses a table without `joint-l-eye` and `joint-r-eye`.
 *
 * @evidence contracts/common.md#principled-implementation The face basis frame is centred on the eyes, so the carry anchor is the eyes' midpoint in the body's own landmarks.
 * @evidence contracts/common.md#clear-and-simple-design One lookup and one average.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing landmark refuses instead of falling back to another joint.
 * @evidence contracts/common.md#meaningful-documentation States the point, its role and the refusal.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the landmark table's frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The anchor is a frame convention, not an anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input.
 */
export function humanPersonEyeCentre(
  landmarks: Readonly<Record<string, IAutoMovieVector3>>,
): IAutoMovieVector3 {
  const left = landmarks["joint-l-eye"];
  const right = landmarks["joint-r-eye"];
  if (left === undefined || right === undefined)
    throw new Error("The person head carry needs the body's joint-l-eye and joint-r-eye landmarks.");
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: (left.z + right.z) / 2,
  };
}
