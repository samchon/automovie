import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodyCappedSurface } from "./humanBodyCappedSurface";

/**
 * The enclosed volume of one already evaluated rest body, in cubic metres.
 * Each surface is closed at its actual boundary and its cap geometry is
 * checked on the current positions. Separate interiors must not overlap or
 * their summed volume would count shared tissue twice. Stature, mass and tape
 * projection reuse this same shaped skin instead of re-evaluating its morphs.
 */
export function humanBodySimpleVolume(
  basis: IAutoMovieHumanBodyBasis,
  shaped: ReturnType<typeof evaluateHumanBodyShape>,
): number {
  const solids = shaped.surfaces.map((positions, index) => {
    const solid = humanBodyCappedSurface(
      positions,
      basis.surfaces[index].indices,
    );
    solid.assertGeometry();
    return solid;
  });
  for (let first = 0; first < solids.length; first++)
    for (let second = first + 1; second < solids.length; second++)
      if (solids[first].overlaps(solids[second]))
        throw new Error("Shaped body surface interiors must not overlap.");
  return solids.reduce((sum, solid) => sum + solid.volume, 0);
}
