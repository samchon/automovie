import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionRing } from "./IAutoMovieRegionRing";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { autoMoviePlanarRegionFailure } from "./autoMoviePlanarRegionFailure";
import { signedArea } from "./signedArea";

/**
 * Validate one planar region and lay its rings out canonically, without
 * cutting triangles.
 *
 * Every point is copied; the outer ring is wound counter-clockwise and each
 * hole clockwise by reversing a ring when its signed area disagrees, and the
 * rings are concatenated outer first, then holes in declared order.
 * `sourceIndices` records each canonical point's index in the flattened input.
 * The input rings are only read.
 *
 * `label` names the region in the thrown diagnostic, so `triangulateRegion`
 * says `polygon` while a loft names the failing section, and the author learns
 * which of several sections holds the bad ring. Triangles are left to
 * `trianglesOf` because a loft validates and lays out every section but
 * triangulates only its two end caps.
 *
 * @param outer Outer boundary in XY metres.
 * @param holes Voids inside the outer boundary.
 * @param label Name of the region in diagnostics.
 * @returns The canonical layout and its enclosed area.
 *
 * @evidence contracts/common.md#principled-implementation `autoMoviePlanarRegionFailure` admits the rings first, then the shoelace signed area decides each ring's winding and a reversal fixes it, which permutes corners but never adds, merges or moves one, so `sourceIndices` stays a permutation of the input.
 * @evidence contracts/common.md#clear-and-simple-design Validation and layout are separated from ear clipping so `triangulateRegion` and the loft share one admission while only the caller that needs triangles pays for them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failing region throws its own named diagnostic rather than being repaired, and reversal is the only normalization, applied identically to every loft section of the same winding so corner correspondence survives.
 * @evidence contracts/common.md#meaningful-documentation States the copy and winding rules, the ring order, what `sourceIndices` addresses, that inputs are read only, why `label` exists, and why triangles are not cut here.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the total point count after validation: one copy, one signed area and at most one reversal per ring, plus one area sum; validation cost is answered on `autoMoviePlanarRegionFailure`.
 * @evidence contracts/performance.md#reuse-equivalent-work A loft calls it once per section and reuses those layouts for every station blend and both caps, so no section is validated or laid out twice.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns newly owned point, index and ring arrays linear in the input point count; the per-ring working copies become those arrays and nothing else is retained.
 * @author Samchon
 */
export const canonicalRegion = (
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): Omit<IAutoMovieRegionTriangulation, "triangles"> => {
  const failure: string | null = autoMoviePlanarRegionFailure({
    outer,
    holes,
    label,
  });
  if (failure !== null) throw new Error(failure);
  const points: IAutoMovieProfilePoint[] = [];
  const sourceIndices: number[] = [];
  const rings: IAutoMovieRegionRing[] = [];
  let area: number = 0;
  [outer, ...holes].forEach(
    (ring: readonly IAutoMovieProfilePoint[], index: number): void => {
      const copy: IAutoMovieProfilePoint[] = ring.map(
        (point: IAutoMovieProfilePoint): IAutoMovieProfilePoint => ({
          x: point.x,
          y: point.y,
        }),
      );
      const local: number[] = copy.map(
        (_point: IAutoMovieProfilePoint, at: number): number => at,
      );
      // Reversal maps corner k to corner size - 1 - k. A loft refuses sections
      // whose rings disagree in winding, so every section is reversed or none
      // is, and corner k of one section still answers to corner k of the next.
      if (signedArea(copy) > 0 !== (index === 0)) {
        copy.reverse();
        local.reverse();
      }
      const start: number = points.length;
      rings.push({ start, count: copy.length });
      copy.forEach((point: IAutoMovieProfilePoint, at: number): void => {
        points.push(point);
        sourceIndices.push(start + local[at]!);
      });
      area += signedArea(copy);
    },
  );
  return { points, sourceIndices, rings, area };
};
