import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodySurfaceBoundary } from "./humanBodySurfaceBoundary";

/**
 * The clip ring a height is measured up to: the surface's open boundary, or
 * on a closed surface (an analytic fixture) its highest vertex alone.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Names the ring the height rule and the stature solve measure to.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Falls back to the highest vertex where no boundary exists, as the height rule specifies.
 */
export function humanBodyClipRing(
  surface: IAutoMovieHumanBodyBasis["surfaces"][number],
): number[] {
  const boundary = humanBodySurfaceBoundary(surface.indices);
  if (boundary.length > 0) return boundary;
  let highest = 0;
  for (let v = 0; v < surface.positions.length / 3; v++)
    if (surface.positions[v * 3 + 1] > surface.positions[highest * 3 + 1])
      highest = v;
  return [highest];
}
