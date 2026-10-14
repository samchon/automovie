import { type IAutoMovieVector3 } from "@automovie/interface";

/** Point `index` of a packed `[x, y, z, ...]` buffer. */
export function subdivisionPoint(
  packed: readonly number[],
  index: number,
): IAutoMovieVector3 {
  return {
    x: packed[index * 3]!,
    y: packed[index * 3 + 1]!,
    z: packed[index * 3 + 2]!,
  };
}
