import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where a line of a length pulls its far end to: kept at its height and slid
 * level toward the near end until the line reaches it, `sqrt(L² − rise²)` from
 * the near end along the level run between them. A far end straight over the
 * near one stays over it.
 *
 * @param near The line's near end.
 * @param far The far end where it rests, out of the line's reach.
 * @param length The line's length.
 * @returns The far end pulled in.
 */
export function humanTetherReach(
  near: IAutoMovieVector3,
  far: IAutoMovieVector3,
  length: number,
): IAutoMovieVector3 {
  const rise: number = far.y - near.y;
  const across: IAutoMovieVector3 = {
    x: far.x - near.x,
    y: 0,
    z: far.z - near.z,
  };
  const reach: number = Math.sqrt(Math.max(0, length * length - rise * rise));
  const flat: number = Math.hypot(across.x, across.z);
  const scale: number = flat > 1e-9 ? reach / flat : 0;
  return {
    x: near.x + across.x * scale,
    y: far.y,
    z: near.z + across.z * scale,
  };
}
