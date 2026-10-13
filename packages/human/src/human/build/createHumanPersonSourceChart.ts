import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import type { IAutoMovieHumanPersonSourceChart } from "../structures/IAutoMovieHumanPersonSourceChart";
import { isHumanPersonSourceIndex } from "./isHumanPersonSourceIndex";

/**
 * Read an admitted partition's dimensionless ordered source chart. An original repeats its own ID at [0,0], a cut uses its original edge at [t,0], and a refinement uses its ordered original-parent corners and two coordinates. The captured record must remain unchanged; this helper does not copy or freeze it. Cached chart arrays are borrowed and must not be mutated. An out-of-domain sample refuses.
 *
 * @evidence contracts/common.md#principled-implementation Canonical sample ranges select original, original-edge or original-parent chart records without inferring identity from positions.
 * @evidence contracts/common.md#clear-and-simple-design One reader selects chart representation while partition admission owns record validity and the shared affine scalar owner owns evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Safe in-domain IDs are required; admitted record contents and caller purity remain premises, and cache lookup supplies no physical geometry or anatomy certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose states original/cut/refinement ordering, dimensionless coordinates, borrowed cached buffers and unchanged captured-record lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Each lookup performs constant index/range work and at most a three-corner copy; cache population follows distinct requested IDs rather than allocating the original namespace extent.
 * @evidence contracts/performance.md#reuse-equivalent-work Each requested canonical ID resolves once for this unchanged partition; changed source records require a new reader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains its source record and queried chart map until dropped; no eviction cap or external task is introduced, and borrowed arrays follow reader lifetime.
 */
export function createHumanPersonSourceChart(
  source: IAutoMovieHumanBasisSourcePartition,
): (sample: number) => IAutoMovieHumanPersonSourceChart {
  const sampleCount: number =
    source.originalVertices +
    source.intersections.length +
    (source.refinements?.length ?? 0);
  const cache: Map<number, IAutoMovieHumanPersonSourceChart> = new Map<number, IAutoMovieHumanPersonSourceChart>();
  return (sample: number): IAutoMovieHumanPersonSourceChart => {
    if (!isHumanPersonSourceIndex(sample, sampleCount))
      throw new Error(
        "Person source sample leaves its captured canonical domain.",
      );
    const cached: IAutoMovieHumanPersonSourceChart | undefined = cache.get(sample);
    if (cached !== undefined) return cached;
    let result: IAutoMovieHumanPersonSourceChart;
    if (sample < source.originalVertices)
      result = { originals: [sample, sample, sample], coordinates: [0, 0] };
    else {
      const virtual: number = sample - source.originalVertices;
      if (virtual < source.intersections.length) {
        const point: IAutoMovieHumanBasisSourcePartition["intersections"][number] = source.intersections[virtual];
        result = {
          originals: [point.a, point.b, point.a],
          coordinates: [point.t, 0],
        };
      } else {
        const point: NonNullable<IAutoMovieHumanBasisSourcePartition["refinements"]>[number] =
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
