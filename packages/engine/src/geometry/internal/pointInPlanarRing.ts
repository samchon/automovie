import type {
  AutoMovieVector2Tuple,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";

import { orientSolidChart } from "../construction/internal/orientSolidChart";

/*
 * Whether a point lies inside a closed ring by the even-odd rule, casting a ray
 * along +X.
 *
 * Callers apply their boundary rules separately. The half-open row test counts
 * a vertex once. For an upward straddle, positive orientation places the probe
 * to the left of the edge's row crossing. A downward straddle reverses the
 * sign. This avoids forming the potentially unrepresentable crossing.
 */
export function pointInPlanarRing(
  point: IAutoMoviePlanarPoint,
  ring: readonly IAutoMoviePlanarPoint[],
): boolean {
  let inside: boolean = false;
  const probe: AutoMovieVector2Tuple = [point.x, point.y];
  for (let index: number = 0; index < ring.length; ++index) {
    const from: IAutoMoviePlanarPoint = ring[index]!;
    const to: IAutoMoviePlanarPoint = ring[(index + 1) % ring.length]!;
    const upward: boolean = to.y > probe[1];
    if (from.y > probe[1] === upward) continue;
    const side: number = orientSolidChart(
      [from.x, from.y],
      [to.x, to.y],
      probe,
    );
    if (upward ? side > 0 : side < 0) inside = !inside;
  }
  return inside;
}
