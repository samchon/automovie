import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The signed step along a line from a point to where the line meets a sphere
 * about a centre on its far side: the larger root of `|d + s u|^2 = r^2` for
 * the point's offset `d` from the centre and the unit direction `u`; undefined
 * when the line misses the sphere (a negative discriminant).
 */
export function HumanWeaponPoseReach(
  d: IAutoMovieVector3,
  u: IAutoMovieVector3,
  r: number,
): number | undefined {
  const b: number = AutoMovieEngineVector3.dot(d, u);
  const disc: number = b * b - AutoMovieEngineVector3.dot(d, d) + r * r;
  return disc < 0 ? undefined : -b + Math.sqrt(disc);
}
