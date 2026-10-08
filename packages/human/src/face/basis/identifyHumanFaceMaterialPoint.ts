import { HumanExactFraction as F } from "../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";

/** Canonical exact source-parent identity shared by publisher and consumers.
 * Parent samples, not local vertex order or XYZ, define the sparse identity.
 * Aliases of one parent combine their coefficients before canonical ordering.
 *
 * @evidence contracts/common.md#principled-implementation Exact coefficient aggregation over actual source samples retains one material identity across local vertex permutations.
 * @evidence contracts/common.md#clear-and-simple-design One owning function canonicalizes the sparse parent/weight key.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coordinates, tolerances and point proximity never determine identity.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes canonical identity ordering from trajectory ordering.
 * @evidence contracts/modeling.md#shared-boundaries Native facet aliases on one source edge share the same exact parent/weight identity.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Indices and coefficients carry no physical unit.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation Assemblies own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical identity carries no clinical norm.
 * @evidenceExclude contracts/anatomy.md#permitted-range Contact/source owners admit physical limits.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal point input.
 * @author Samchon
 */
export function identifyHumanFaceMaterialPoint(
  surface: IAutoMovieHumanFaceBasisSurface,
  triangle: number,
  weights: readonly IHumanExactFraction[],
): string {
  const partition = surface.sourcePartition;
  if (partition === undefined || !Number.isInteger(triangle) || triangle < 0 ||
      3 * triangle + 2 >= surface.indices.length || weights.length !== 3 ||
      weights.some((weight) => weight.numerator < 0n || weight.denominator <= 0n) ||
      F.compare(weights.reduce((sum, weight) => F.add(sum, weight), F.create(0n)), F.create(1n)) !== 0)
    throw new Error("Material identity needs actual native source incidence and exact unit weights.");
  const parents = new Map<number, IHumanExactFraction>();
  for (let axis = 0; axis < 3; axis++) {
    if (weights[axis].numerator === 0n) continue;
    const parent = partition.samples[surface.indices[3 * triangle + axis]];
    if (!Number.isSafeInteger(parent) || parent < 0)
      throw new Error("Material identity names an absent canonical source parent.");
    parents.set(parent, F.add(parents.get(parent) ?? F.create(0n), weights[axis]));
  }
  return [...parents].sort(([a], [b]) => a - b)
    .map(([parent, weight]) => `${parent}:${weight.numerator}/${weight.denominator}`).join("|");
}
