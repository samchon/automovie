import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import { millimetrePoint as p } from "../../mesh/millimetrePoint";
import { IPortraitDentalArc } from "./structures/IPortraitDentalArc";

/**
 * Parameterize an ordered spatial guide and continue its ends posteriorly.
 * Sampling uses cumulative XZ distance, independent of any Y variation. The
 * current dental row supplies a planar elliptical guide and owns its common
 * gingival height; this sampler does not attach individual teeth to lip points.
 *
 * @evidence contracts/common.md#principled-implementation A sampled ordered guide plus posterior Bezier tails is addressed by cumulative positive XZ distance, with the current row supplying a planar ellipse and common gingival height.
 * @evidence contracts/common.md#clear-and-simple-design Construction owns guide points/cumulative stations while the returned sampler uses binary search and local chord interpolation for position/tangent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero or non-finite horizontal steps refuse; this sampled parameterization is not exact spline arc length or individual attachment to lip points.
 * @evidence contracts/common.md#meaningful-documentation The prose states XZ-only distance, independent Y, posterior extension and current dental-row placement ownership.
 * @evidence contracts/performance.md#efficient-algorithms Creation validates all N input guide points, then stores 257 core and 64 points per tail; each Catmull-Rom read touches four neighbours and each query binary-searches the fixed cumulative array.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned sampler reuses compiled points/stations for every tooth centre and tangent; changed guide input requires a new arc.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned arc closure retains its fixed 385 guide points and cumulative scalars until released, with no global geometry cache or handle.
 */
export function createPortraitDentalArc(
  upper: IAutoMovieVector3[],
  rowLength: number,
): IPortraitDentalArc {
  if (
    upper.length < 3 ||
    !Number.isFinite(rowLength) ||
    rowLength <= 0 ||
    upper.some(
      (point: IAutoMovieVector3): boolean =>
        ![point.x, point.y, point.z].every(Number.isFinite),
    )
  )
    throw new Error(
      "A dental arc needs a finite upper rim and positive row length.",
    );
  const core: IAutoMovieVector3[] = Array.from(
    { length: 257 },
    (_v: unknown, i: number): IAutoMovieVector3 =>
      catmullRomPoint(upper, i / 256),
  );
  const extension: number = Math.max(12, rowLength / 2);
  const tail: (
    corner: IAutoMovieVector3,
    neighbour: IAutoMovieVector3,
  ) => IAutoMovieVector3[] = (
    corner: IAutoMovieVector3,
    neighbour: IAutoMovieVector3,
  ): IAutoMovieVector3[] => {
    const tangent: IAutoMovieVector3 = Vector3.normalize(
      p(corner.x - neighbour.x, 0, corner.z - neighbour.z),
    );
    if (Vector3.length(tangent) === 0)
      throw new Error("A dental arc needs nonzero horizontal corner tangents.");
    const a: IAutoMovieVector3 = Vector3.add(
      corner,
      Vector3.scale(tangent, extension / 3),
    );
    const b: IAutoMovieVector3 = p(
      a.x,
      corner.y,
      corner.z - (2 * extension) / 3,
    );
    const end: IAutoMovieVector3 = p(a.x, corner.y, corner.z - extension);
    return Array.from(
      { length: 65 },
      (_v: unknown, i: number): IAutoMovieVector3 => {
        const t: number = i / 64,
          s: number = 1 - t;
        return Vector3.add(
          Vector3.add(
            Vector3.scale(corner, s ** 3),
            Vector3.scale(a, 3 * s * s * t),
          ),
          Vector3.add(
            Vector3.scale(b, 3 * s * t * t),
            Vector3.scale(end, t ** 3),
          ),
        );
      },
    );
  };
  const left: IAutoMovieVector3[] = tail(core[0], core[1]).slice(1).reverse();
  const right: IAutoMovieVector3[] = tail(core[256], core[255]).slice(1);
  const points: IAutoMovieVector3[] = [...left, ...core, ...right];
  const cumulative: number[] = [0];
  for (let i: number = 1; i < points.length; i++) {
    const distance: number = Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].z - points[i - 1].z,
    );
    if (!(distance > 0) || !Number.isFinite(distance))
      throw new Error(
        "A dental guide must advance at every horizontal sample.",
      );
    cumulative.push(cumulative[i - 1] + distance);
  }
  const length: number = cumulative[cumulative.length - 1];
  return {
    length,
    center: cumulative[left.length + 128],
    sample: (
      distance: number,
    ): { position: IAutoMovieVector3; tangent: IAutoMovieVector3 } => {
      if (!Number.isFinite(distance) || distance < 0 || distance > length)
        throw new Error("Dental distance must stay on its finite guide.");
      let low: number = 0,
        high: number = points.length - 1;
      while (high - low > 1) {
        const middle: number = Math.floor((low + high) / 2);
        if (cumulative[middle] <= distance) low = middle;
        else high = middle;
      }
      const t: number =
        (distance - cumulative[low]) / (cumulative[high] - cumulative[low]);
      return {
        position: Vector3.lerp(points[low], points[high], t),
        tangent: Vector3.normalize(
          p(points[high].x - points[low].x, 0, points[high].z - points[low].z),
        ),
      };
    },
  };
}
