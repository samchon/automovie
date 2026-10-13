import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonSourceChart } from "../structures/IAutoMovieHumanPersonSourceChart";
import type { IAutoMovieHumanPersonSourceWeight } from "../structures/IAutoMovieHumanPersonSourceWeight";

/**
 * Read positive original-corner weights through the same ordered affine scalar owner used by source geometry and shading. Original charts repeat their ID but only their positive slot contributes. The supplied chart reader must stay deterministic and unchanged. Memoized arrays are borrowed without runtime freezing; callers must not mutate them.
 *
 * @evidence contracts/common.md#principled-implementation Three affine basis probes select positive ordered corner weights and retain the chart's canonical original IDs.
 * @evidence contracts/common.md#clear-and-simple-design This reader converts charts to sparse positive preimages while chart selection and finite closed-chart arithmetic retain dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No weights are renormalized or spatial correspondence inferred; invalid affine coordinates still refuse through the shared scalar evaluator.
 * @evidence contracts/common.md#meaningful-documentation Prose gives dimensionless weights, repeated original-corner behavior and borrowed mutable-cache purity.
 * @evidence contracts/performance.md#efficient-algorithms A first lookup pays supplied chart cost plus three fixed affine probes; later lookups use the sample map.
 * @evidence contracts/performance.md#reuse-equivalent-work Each canonical sample resolves once for this unchanged chart reader, independent of geometric coordinate changes that preserve its source lineage.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains its reader and distinct requested preimages until dropped, without an independent eviction cap or running task.
 */
export function createHumanPersonSourcePreimage(
  chart: (sample: number) => IAutoMovieHumanPersonSourceChart,
): (sample: number) => readonly IAutoMovieHumanPersonSourceWeight[] {
  const cache: Map<number, readonly IAutoMovieHumanPersonSourceWeight[]> = new Map<number, readonly IAutoMovieHumanPersonSourceWeight[]>();
  return (sample: number): readonly IAutoMovieHumanPersonSourceWeight[] => {
    const cached: readonly IAutoMovieHumanPersonSourceWeight[] | undefined = cache.get(sample);
    if (cached !== undefined) return cached;
    const one: IAutoMovieHumanPersonSourceChart = chart(sample);
    const weights: IAutoMovieHumanPersonSourceWeight[] = [0, 1, 2].flatMap((corner: number): IAutoMovieHumanPersonSourceWeight[] => {
      const weight: number = interpolateHumanBasisSourceTriangle(
        [corner === 0 ? 1 : 0, corner === 1 ? 1 : 0, corner === 2 ? 1 : 0],
        one.coordinates,
      );
      return weight > 0 ? [{ id: one.originals[corner], weight }] : [];
    });
    cache.set(sample, weights);
    return weights;
  };
}
