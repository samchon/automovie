import { IAutoMovieVector3 } from "@automovie/interface";

/*
 * A set piece's optional size multiplier as the node transform's scale.
 *
 * Omitted keeps the model's authored size, a number scales uniformly, and a
 * vector scales per axis and is returned as given. One forged primitive can
 * therefore stand in for a wall, a step and a table top, the same box at three
 * sizes. The result is not validated here: `stageScene` refuses a non-finite or
 * non-positive axis.
 * Parameter scale: The authored multiplier, or `undefined`.
 * Returns: The per-axis scale.
 */
export function setPieceScale(
  scale: number | IAutoMovieVector3 | undefined,
): IAutoMovieVector3 {
  if (scale === undefined) return { x: 1, y: 1, z: 1 };
  if (typeof scale === "number") return { x: scale, y: scale, z: scale };
  return scale;
}
