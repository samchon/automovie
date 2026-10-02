import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodySurfaceBoundary } from "./humanBodySurfaceBoundary";

/**
 * The clip ring a height is measured up to: the highest open boundary loop, or
 * on a closed surface (an analytic fixture) its highest vertex alone.
 *
 * @evidence contracts/common.md#principled-implementation The clip is the neck opening, which is the open boundary loop read from topology, and with several openings the highest mean height is the one the height runs up to; a closed surface has no opening, so its highest vertex stands for the top.
 * @evidence contracts/common.md#clear-and-simple-design One choice of ring over the boundary loops the topology owner already found.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No height or plane is remembered; the ring comes from the indices and the current positions.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the ring is and the closed-surface fallback.
 * @evidence contracts/modeling.md#spatial-conventions Heights are Y in metres of the positions passed; the default is the basis rest positions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; it reads the boundary that `humanBodySurfaceBoundary` finds.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a body.
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
