import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanPersonSourceChart } from "../structures/IAutoMovieHumanPersonSourceChart";
import { isHumanPersonSourceIndex } from "./isHumanPersonSourceIndex";

/**
 * The chart of each canonical source sample of an admitted, owned partition
 * record: an original vertex is its own chart at zero; a cut sample reads its
 * original edge at its fraction; a refinement reads its parent's corners at
 * its two coordinates. Charts are memoized per requested sample, and the
 * returned buffers are borrowed read-only. A sample outside the captured
 * domain refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Each sample's chart is read from the frozen record it was compiled with, never from caller arrays.
 * @evidence contracts/common.md#clear-and-simple-design Three cases and a cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-domain sample refuses instead of reading a neighbour.
 * @evidence contracts/common.md#meaningful-documentation States each case, the cache and the refusal.
 * @evidence contracts/modeling.md#shared-boundaries Cut samples chart through the one ordered cut table both partitions share.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Chart coordinates are dimensionless.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits sample ids, not anatomy.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function createHumanPersonSourceChart(
  source: IAutoMovieHumanBasisSourcePartition,
): (sample: number) => IAutoMovieHumanPersonSourceChart {
  const sampleCount =
    source.originalVertices +
    source.intersections.length +
    (source.refinements?.length ?? 0);
  const cache = new Map<number, IAutoMovieHumanPersonSourceChart>();
  return (sample) => {
    if (!isHumanPersonSourceIndex(sample, sampleCount))
      throw new Error(
        "Person source sample leaves its captured canonical domain.",
      );
    const cached = cache.get(sample);
    if (cached !== undefined) return cached;
    let result: IAutoMovieHumanPersonSourceChart;
    if (sample < source.originalVertices)
      result = { originals: [sample, sample, sample], coordinates: [0, 0] };
    else {
      const virtual = sample - source.originalVertices;
      if (virtual < source.intersections.length) {
        const point = source.intersections[virtual];
        result = {
          originals: [point.a, point.b, point.a],
          coordinates: [point.t, 0],
        };
      } else {
        const point =
          source.refinements![virtual - source.intersections.length];
        result = {
          originals: source.parentTriangles.slice(
            point.parent * 3,
            point.parent * 3 + 3,
          ) as [number, number, number],
          coordinates: [...point.coordinates],
        };
      }
    }
    cache.set(sample, result);
    return result;
  };
}
