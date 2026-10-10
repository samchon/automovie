import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";

/**
 * Read a source vertex or frozen crossing's complete bone-weight map.
 * Seam reach measurement and face collar binding share this reader. The four
 * source influences are accumulated by bone before the edge blend, so repeated
 * slots and differing endpoint bone orders preserve their meaning. No influence
 * is discarded at a crossing; the face skin owner applies its own final limit.
 * Read-only dimensionless inputs return an owned map, not a pose operator.
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
  const stencil =
    cut === undefined || vertex < cut.margins.length
      ? { a: vertex, b: vertex, t: 0 }
      : cut.intersections[vertex - cut.margins.length];
  const result = new Map<T, number>();
  for (const [endpoint, share] of [
    [stencil.a, 1 - stencil.t],
    [stencil.b, stencil.t],
  ])
    for (let slot = 0; slot < 4; slot++) {
      const weight = share * skin.weights[endpoint * 4 + slot];
      if (weight === 0) continue;
      const bone = skin.joints[skin.boneIndices[endpoint * 4 + slot]];
      result.set(bone, (result.get(bone) ?? 0) + weight);
    }
  return result;
}
