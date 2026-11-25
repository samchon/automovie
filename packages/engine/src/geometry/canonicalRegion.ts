import type {
  IAutoMovieProfilePoint,
  IAutoMovieRegionRing,
  IAutoMovieRegionTriangulation,
} from "@automovie/interface";

import { autoMoviePlanarRegionFailure } from "./autoMoviePlanarRegionFailure";
import { signedArea } from "./signedArea";

/**
 * Validate one planar region and lay its rings out canonically, without cutting
 * triangles.
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
