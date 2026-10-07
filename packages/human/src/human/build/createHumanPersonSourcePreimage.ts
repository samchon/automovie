import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonSourceChart } from "../structures/IAutoMovieHumanPersonSourceChart";
import type { IAutoMovieHumanPersonSourceWeight } from "../structures/IAutoMovieHumanPersonSourceWeight";

/**
 * The original-vertex preimage of each canonical source sample: the positive
 * affine weights of its chart's three corners, through the same scalar affine
 * owner geometry and shading use. Memoized per requested sample; the returned
 * arrays are borrowed read-only.
 *
 * @evidence contracts/common.md#principled-implementation Preimage weights come from the shared affine owner, so geometry and shading read the same weights.
 * @evidence contracts/common.md#clear-and-simple-design Three corner weights, positive ones kept, cached.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero-weight corners are omitted rather than kept as placeholders.
 * @evidence contracts/common.md#meaningful-documentation States the weights, the owner and the cache.
 * @evidence contracts/modeling.md#shared-boundaries A shared sample has one preimage for both partitions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Weights are dimensionless.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function createHumanPersonSourcePreimage(
  chart: (sample: number) => IAutoMovieHumanPersonSourceChart,
): (sample: number) => readonly IAutoMovieHumanPersonSourceWeight[] {
  const cache = new Map<number, readonly IAutoMovieHumanPersonSourceWeight[]>();
  return (sample) => {
    const cached = cache.get(sample);
    if (cached !== undefined) return cached;
    const one = chart(sample);
    const weights = [0, 1, 2].flatMap((corner) => {
      const weight = interpolateHumanBasisSourceTriangle(
        [corner === 0 ? 1 : 0, corner === 1 ? 1 : 0, corner === 2 ? 1 : 0],
        one.coordinates,
      );
      return weight > 0 ? [{ id: one.originals[corner], weight }] : [];
    });
    cache.set(sample, weights);
    return weights;
  };
}
