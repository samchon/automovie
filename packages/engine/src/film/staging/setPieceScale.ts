import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Lower a set piece's optional size multiplier onto the node transform's scale:
 * omitted keeps the model's authored size, a bare number scales uniformly, a
 * vector scales per axis. One forged primitive can therefore stand in for a
 * whole set, a wall, a step, and a table top are the same box at three sizes
 * (#1173).
 */
export const setPieceScale = (
  scale: number | IAutoMovieVector3 | undefined,
): IAutoMovieVector3 => {
  if (scale === undefined) return { x: 1, y: 1, z: 1 };
  if (typeof scale === "number") return { x: scale, y: scale, z: scale };
  return scale;
};
