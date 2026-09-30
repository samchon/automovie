import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodyCappedSurface } from "./humanBodyCappedSurface";

/**
 * The enclosed volume of one already evaluated rest body, in cubic metres.
 * Each surface is closed at its actual boundary and its cap geometry is
 * checked on the current positions. Separate interiors must not overlap or
 * their summed volume would count shared tissue twice. Stature, mass and tape
 * projection reuse this same shaped skin instead of re-evaluating its morphs.
 *
 * @evidence contracts/common.md#principled-implementation The summed volume is the sum of each closed solid's volume, which is the whole body's volume only if the solids share no interior, so every solid's cap is checked and every pair is tested for overlap and refused instead of counted twice.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: the checked volume of an already shaped body. Evaluation, capping and the mass model are separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No surface count, index or expected volume is special-cased; a violation refuses with its reason.
 * @evidence contracts/common.md#meaningful-documentation The comment states the unit, the checks made before a volume is trusted and why the shaped skin is reused.
 * @evidence contracts/modeling.md#spatial-conventions The volume is cubic metres of positions in the basis frame; no conversion occurs.
 * @evidence contracts/modeling.md#shared-boundaries Separate interiors are checked for overlap on the current positions and refused when they share volume.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry the viewer displays; the cap fan is an internal measuring surface of one triangle per boundary edge.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no quantity; it refuses a degenerate or crossing cap and the caller refuses unreachable targets.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a body.
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
