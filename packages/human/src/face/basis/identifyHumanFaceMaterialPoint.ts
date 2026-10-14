import { HumanExactFraction as F } from "../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../common/measure/IHumanExactFraction";
import type { IAutoMovieHumanFaceBasisSurface } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanBasisSourcePartition as IAutoMovieHumanBasisSourcePartitionImported } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";


/** Canonical exact source-parent identity shared by publisher and consumers.
 * Parent samples, not local vertex order or XYZ, define the sparse identity.
 * Aliases of one parent combine their coefficients before canonical ordering.
 *
 * @evidence contracts/common.md#principled-implementation Exact nonnegative unit barycentric fractions are accumulated by safe canonical parent sample, then sorted and serialized in reduced rational form. This preserves one material identity across render aliases/triangle order for the publisher and consumers; the admitted source partition supplies correct incidence.
 * @evidence contracts/common.md#clear-and-simple-design One source-parent address owner handles validation, alias coefficient accumulation and canonical spelling; no geometric nearest-point or independent floating identity layer is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing partition, nonresident triangle, invalid weights or absent safe parents refuse. XYZ coincidence and local render ordinals do not substitute for registered source ownership; this sparse identity is scoped by the separate source-generation owner.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes parent identity from coordinates/local order and explains alias coefficient combination before canonical sorting.
 * @evidence contracts/performance.md#efficient-algorithms At most three corners are validated, combined and sorted; bigint rational arithmetic cost follows numerator/denominator bit lengths rather than being numerically constant. Output spelling likewise follows represented rational size.
 * @evidence contracts/performance.md#reuse-equivalent-work Zero weights are omitted and repeated parent coefficients combine before one canonical serialization. Publisher and consumers call the same owner; no cache reuses an address across changed source partitions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A local map holds at most three parent fractions and returns one string; bigint sizes follow caller inputs without a separate bit-size cap. No source buffer, external handle or address history is retained.
 *
 * @author Samchon
 */
export function identifyHumanFaceMaterialPoint(
  surface: IAutoMovieHumanFaceBasisSurface,
  triangle: number,
  weights: readonly IHumanExactFraction[],
): string {
  const partition: IAutoMovieHumanBasisSourcePartitionImported | undefined = surface.sourcePartition;
  if (partition === undefined || !Number.isInteger(triangle) || triangle < 0 ||
      3 * triangle + 2 >= surface.indices.length || weights.length !== 3 ||
      weights.some((weight: IHumanExactFraction): boolean  => weight.numerator < 0n || weight.denominator <= 0n) ||
      F.compare(weights.reduce((sum: IHumanExactFraction, weight: IHumanExactFraction): IHumanExactFraction  => F.add(sum, weight), F.create(0n)), F.create(1n)) !== 0)
    throw new Error("Material identity needs actual native source incidence and exact unit weights.");
  const parents: Map<number, IHumanExactFraction> = new Map<number, IHumanExactFraction>();
  for (let axis: number = 0; axis < 3; axis++) {
    if (weights[axis].numerator === 0n) continue;
    const parent: number = partition.samples[surface.indices[3 * triangle + axis]];
    if (!Number.isSafeInteger(parent) || parent < 0)
      throw new Error("Material identity names an absent canonical source parent.");
    parents.set(parent, F.add(parents.get(parent) ?? F.create(0n), weights[axis]));
  }
  return [...parents].sort(([a]: [number, IHumanExactFraction], [b]: [number, IHumanExactFraction]): number  => a - b)
    .map(([parent, weight]: [number, IHumanExactFraction]): string  => `${parent}:${weight.numerator}/${weight.denominator}`).join("|");
}
