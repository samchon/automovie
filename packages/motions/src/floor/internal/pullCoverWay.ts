import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The point a share of the way along a polyline: its length measured along its
 * pieces, the share clamped to the way.
 * Parameter way: The polyline's points, two or more.
 * Parameter progress: The share of its length, 0 to 1.
 * Returns: The point, metres.
 */
export function pullCoverWay(
  way: readonly IAutoMovieVector3[],
  progress: number,
): IAutoMovieVector3 {
  const lengths: number[] = way
    .slice(1)
    .map((q: IAutoMovieVector3, i: number): number =>
      Vector3.distance(way[i]!, q),
    );
  let left: number =
    Math.min(1, Math.max(0, progress)) *
    lengths.reduce((a: number, b: number): number => a + b, 0);
  for (let i: number = 0; i < lengths.length; ++i) {
    if (left <= lengths[i]! || i === lengths.length - 1)
      return Vector3.lerp(
        way[i]!,
        way[i + 1]!,
        Math.min(1, left / Math.max(1e-9, lengths[i]!)),
      );
    left -= lengths[i]!;
  }
  return way.at(-1)!;
}
