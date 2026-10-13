import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A set piece's optional size multiplier as the node transform's scale.
 *
 * Omitted keeps the model's authored size, a number scales uniformly, and a
 * vector scales per axis and is returned as given. One forged primitive can
 * therefore stand in for a wall, a step and a table top, the same box at three
 * sizes. The result is not validated here: `stageScene` refuses a non-finite
 * or non-positive axis.
 *
 * @param scale The authored multiplier, or `undefined`.
 * @returns The per-axis scale.
 *
 * @evidence contracts/common.md#principled-implementation Maps the three authored spellings onto the per-axis scale of a `T · R · S` transform, where a uniform number is the same factor on every axis.
 * @evidence contracts/common.md#clear-and-simple-design The one reading of the multiplier, used by `stageScene` to validate it and by `setPieceTransform` to compose the node, so the check and the composition read one scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No piece or model is special-cased, and an invalid axis is passed through for the staging gate to refuse rather than corrected here.
 * @evidence contracts/common.md#meaningful-documentation States each spelling's meaning, that a vector is returned as given, the purpose, and where validation happens.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant work with at most one small allocation, with no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reads one value per call and coordinates no work across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; a vector input is returned by reference, so the scene node shares it with the staging write, and the other spellings allocate a fresh vector.
 */
export function setPieceScale (
  scale: number | IAutoMovieVector3 | undefined,
): IAutoMovieVector3 {
  if (scale === undefined) return { x: 1, y: 1, z: 1 };
  if (typeof scale === "number") return { x: scale, y: scale, z: scale };
  return scale;
}
