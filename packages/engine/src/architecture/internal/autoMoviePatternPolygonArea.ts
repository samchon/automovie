import type { IAutoMoviePatternPoint } from "@automovie/interface";

/*
 * The unsigned area, in square metres, a face-local outline encloses.
 *
 * The outline closes from its last corner to its first and may wind either way.
 * With suitable finite intermediates, fewer than three corners give zero; an
 * empty ring always gives zero. Non-finite input/products can instead yield
 * `NaN` or infinity.
 * Parameter polygon: Simple outline in face-local metres.
 * Returns: The absolute shoelace result; non-finite intermediates can yield
 * `NaN` or infinity.
 */
export function autoMoviePatternPolygonArea(
  polygon: readonly IAutoMoviePatternPoint[],
): number {
  let twice: number = 0;
  for (let index: number = 0; index < polygon.length; ++index) {
    const from: IAutoMoviePatternPoint = polygon[index]!;
    const to: IAutoMoviePatternPoint = polygon[(index + 1) % polygon.length]!;
    twice += from.u * to.v - to.u * from.v;
  }
  return Math.abs(twice) / 2;
}
