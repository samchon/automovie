import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Lower a set piece's optional size multiplier onto the node transform's scale:
 * omitted keeps the model's authored size, a bare number scales uniformly, a
 * vector scales per axis. One forged primitive can therefore stand in for a
 * whole set, a wall, a step, and a table top are the same box at three sizes
 * (#1173).
 *
 * @evidence requirements/staging/scope-and-source-of-truth.md#staging-resolved-scene-state Lowers omitted or scalar set-piece size into the same world-space axis scale consumed by placement validation and scene composition.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership Lowers omitted or scalar set-piece size into the same world-space axis scale consumed by placement validation and scene composition.
 */
export const setPieceScale = (
  scale: number | IAutoMovieVector3 | undefined,
): IAutoMovieVector3 => {
  if (scale === undefined) return { x: 1, y: 1, z: 1 };
  if (typeof scale === "number") return { x: scale, y: scale, z: scale };
  return scale;
};
