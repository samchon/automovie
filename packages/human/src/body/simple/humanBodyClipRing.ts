import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodySurfaceBoundary } from "./humanBodySurfaceBoundary";

/**
 * The clip ring a height is measured up to: the highest open boundary loop, or
 * on a closed surface (an analytic fixture) its highest vertex alone.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Names the ring the height rule and the stature solve measure to.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Falls back to the highest vertex where no boundary exists, as the height rule specifies.
 */
export function humanBodyClipRing(
  surface: IAutoMovieHumanBodyBasis["surfaces"][number],
  positions: number[] = surface.positions,
): number[] {
  const loops = humanBodySurfaceBoundary(surface.indices, true);
  if (loops.length > 0)
    return loops.reduce((highest, loop) =>
      meanHeight(positions, loop) > meanHeight(positions, highest)
        ? loop
        : highest,
    );
  let highest = 0;
  for (let v = 0; v < positions.length / 3; v++)
    if (positions[v * 3 + 1] > positions[highest * 3 + 1]) highest = v;
  return [highest];
}

function meanHeight(positions: number[], loop: number[]): number {
  return loop.reduce((sum, v) => sum + positions[v * 3 + 1], 0) / loop.length;
}
