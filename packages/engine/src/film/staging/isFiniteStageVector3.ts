import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Whether a staged vector's `x`, `y` and `z` are all finite numbers.
 *
 * It checks without repairing, so the caller reports the authored value as
 * written. Positions are in metres; light directions are unitless and may have
 * any non-zero length, which this test does not judge.
 *
 * @param vector A staged position, target or direction, as authored.
 * @returns `true` only when the three components are finite.
 */
export function isFiniteStageVector3(vector: IAutoMovieVector3): boolean {
  return (
    Number.isFinite(vector.x) &&
    Number.isFinite(vector.y) &&
    Number.isFinite(vector.z)
  );
}
