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
 * @evidence contracts/common.md#principled-implementation The guide is resampled by cumulative horizontal (XZ) arc length, which is the metric crown widths are measured in, so placing by distance keeps every tooth's width when the arch curves; the posterior continuations are cubic Bezier tails that leave each corner along its own tangent and turn posteriorly. The premises (three or more finite points, a positive row length, nonzero corner tangents and a strictly advancing guide) are checked, and the sampler refuses a distance off the guide.
 * @evidence contracts/common.md#clear-and-simple-design One sampler over a fixed number of samples; it attaches no tooth to a lip point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; the sample counts and tail extent are the parameterization's own.
 * @evidence contracts/common.md#meaningful-documentation The comment states the metric, that the posterior continuation is inferred and that the row owns the gingival height.
 * @evidence contracts/modeling.md#spatial-conventions Points and distances are head-frame millimetres; the tangent is unitless and horizontal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function parameterizes a curve and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; the fixed sample counts are internal to the parameterization.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond the guide it parameterizes.
 */
export function createPortraitDentalArc(
  upper: IAutoMovieVector3[],
  rowLength: number,
): IPortraitDentalArc {
  if (
    upper.length < 3 ||
    !Number.isFinite(rowLength) ||
    rowLength <= 0 ||
    upper.some((point) => ![point.x, point.y, point.z].every(Number.isFinite))
  )
    throw new Error(
      "A dental arc needs a finite upper rim and positive row length.",
    );
  const core = Array.from({ length: 257 }, (_v, i) =>
    catmullRomPoint(upper, i / 256),
  );
  const extension = Math.max(12, rowLength / 2);
  const tail = (
    corner: IAutoMovieVector3,
    neighbour: IAutoMovieVector3,
  ): IAutoMovieVector3[] => {
    const tangent = Vector3.normalize(
      p(corner.x - neighbour.x, 0, corner.z - neighbour.z),
    );
    if (Vector3.length(tangent) === 0)
      throw new Error("A dental arc needs nonzero horizontal corner tangents.");
    const a = Vector3.add(corner, Vector3.scale(tangent, extension / 3));
    const b = p(a.x, corner.y, corner.z - (2 * extension) / 3);
    const end = p(a.x, corner.y, corner.z - extension);
    return Array.from({ length: 65 }, (_v, i) => {
      const t = i / 64,
        s = 1 - t;
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
    });
  };
  const left = tail(core[0], core[1]).slice(1).reverse();
  const right = tail(core[256], core[255]).slice(1);
  const points = [...left, ...core, ...right];
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const distance = Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].z - points[i - 1].z,
    );
    if (!(distance > 0) || !Number.isFinite(distance))
      throw new Error(
        "A dental guide must advance at every horizontal sample.",
      );
    cumulative.push(cumulative[i - 1] + distance);
  }
  const length = cumulative[cumulative.length - 1];
  return {
    length,
    center: cumulative[left.length + 128],
    sample: (distance) => {
      if (!Number.isFinite(distance) || distance < 0 || distance > length)
        throw new Error("Dental distance must stay on its finite guide.");
      let low = 0,
        high = points.length - 1;
      while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if (cumulative[middle] <= distance) low = middle;
        else high = middle;
      }
      const t =
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
