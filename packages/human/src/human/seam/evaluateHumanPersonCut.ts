import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Append the seam's frozen edge samples to a source position array.
 * Neutral compilation and already posed body endpoints use this same stencil.
 * Interpolating after the body's nonlinear skinning preserves the source
 * triangle's performed surface; skinning an interpolated weight/rest point
 * would produce a different point. Arrays are owned, metres remain in the
 * caller's frame, and original source numbers never change.
 */
export function evaluateHumanPersonCut(
  positions: readonly number[],
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>,
): number[] {
  return [
    ...positions,
    ...cut.intersections.flatMap(({ a, b, t }) =>
      [0, 1, 2].map(
        (axis) =>
          (1 - t) * positions[a * 3 + axis] + t * positions[b * 3 + axis],
      ),
    ),
  ];
}
