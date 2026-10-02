import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Read a source vertex or frozen crossing's complete bone-weight map.
 * Seam reach measurement and face collar binding share this reader. The four
 * source influences are accumulated by bone before the edge blend, so repeated
 * slots and differing endpoint bone orders preserve their meaning. No influence
 * is discarded at a crossing; the face skin owner applies its own final limit.
 * Read-only dimensionless inputs return an owned map, not a pose operator.
 *
 * @evidence contracts/common.md#principled-implementation Bone-wise affine interpolation preserves the convex weight combination, including endpoints with different influence identities; accumulation avoids slot-order interpolation.
 * @evidence contracts/common.md#clear-and-simple-design A single reader supplies original and crossing weights to both seam consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No intermediate pruning substitutes for the full edge weight field.
 * @evidence contracts/common.md#meaningful-documentation States accumulation, interpolation, ownership and final pruning responsibility.
 * @evidence contracts/modeling.md#spatial-conventions Weights and edge fractions are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Reads the seam's frozen cut and constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Owns no displayed form.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no user input.
 */
export function humanPersonCutBoneWeights<T extends string>(
  skin: { joints: readonly T[]; boneIndices: readonly number[]; weights: readonly number[] },
  vertex: number,
  cut?: IAutoMovieHumanPersonSeam["cut"],
): Map<T, number> {
  const stencil = cut === undefined || vertex < cut.margins.length
    ? { a: vertex, b: vertex, t: 0 }
    : cut.intersections[vertex - cut.margins.length];
  const result = new Map<T, number>();
  for (const [endpoint, share] of [[stencil.a, 1 - stencil.t], [stencil.b, stencil.t]])
    for (let slot = 0; slot < 4; slot++) {
      const weight = share * skin.weights[endpoint * 4 + slot];
      if (weight === 0) continue;
      const bone = skin.joints[skin.boneIndices[endpoint * 4 + slot]];
      result.set(bone, (result.get(bone) ?? 0) + weight);
    }
  return result;
}
