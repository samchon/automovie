import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Read the complete dimensionless bone-weight map of an admitted source vertex or captured cut crossing. Four source slots at each endpoint accumulate by bone before edge blending, preserving repeated slots and different joint orders without discarding crossing influences. The face skin consumer later owns top-four truncation/normalization. Valid rows, joint indices and crossing ordinal are caller premises; this reader neither revalidates them nor runs a pose operator. Inputs remain unchanged and the result map is owned.
 *
 * @evidence contracts/common.md#principled-implementation Actual source slots and captured affine endpoint shares determine the bone-keyed weight map used by reach and face collar binding.
 * @evidence contracts/common.md#clear-and-simple-design One generic bone-key reader accumulates source/crossing weights; pose evaluation and final influence limits remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated slots are summed by bone and no influence is prematurely discarded, while valid source metadata is an explicit premise rather than fabricated lineage or tissue mechanics.
 * @evidence contracts/common.md#meaningful-documentation Prose states dimensionless gains, admitted ordinal/index domain, owned map and downstream limit/pose ownership.
 * @evidence contracts/performance.md#efficient-algorithms Two endpoint stencils and four slots each give at most eight map accumulations, independent of source mesh size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each vertex/crossing map is derived from supplied source tables anew; this reader owns no evaluated-weight or request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the at-most-eight-bone owned map escapes, retaining bone keys rather than source tables, geometry or a running task.
 */
export function humanPersonCutBoneWeights<T extends string>(
  skin: {
    joints: readonly T[];
    boneIndices: readonly number[];
    weights: readonly number[];
  },
  vertex: number,
  cut?: IAutoMovieHumanPersonSeam["cut"],
): Map<T, number> {
  const stencil: { a: number; b: number; t: number } =
    cut === undefined || vertex < cut.margins.length
      ? { a: vertex, b: vertex, t: 0 }
      : cut.intersections[vertex - cut.margins.length];
  const result: Map<T, number> = new Map<T, number>();
  for (const [endpoint, share] of [
    [stencil.a, 1 - stencil.t],
    [stencil.b, stencil.t],
  ])
    for (let slot: number = 0; slot < 4; slot++) {
      const weight: number = share * skin.weights[endpoint * 4 + slot];
      if (weight === 0) continue;
      const bone: T = skin.joints[skin.boneIndices[endpoint * 4 + slot]];
      result.set(bone, (result.get(bone) ?? 0) + weight);
    }
  return result;
}
