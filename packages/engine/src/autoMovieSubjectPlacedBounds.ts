import {
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { transformAutoMovieDrawingPoint } from "./drawing/transformAutoMovieDrawingPoint";
import { Matrix4 } from "./math/Matrix4";

/**
 * The world box of model-frame points placed by one node transform, or null
 * when there are no points.
 *
 * The transform is composed as `T * R * S` by `Matrix4.compose`, each point is
 * moved through it, and the componentwise minimum and maximum are folded as
 * the points are placed, so no placed copy of the point list is built. Units
 * follow the points and the translation, metres for every subject.
 *
 * @param points Model-frame points, typically a model's or a part's vertices.
 * @param transform Placement of the model in world space.
 * @returns The axis-aligned box of the placed points, new and caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation Places each vertex with the same column-major TRS matrix the renderer composes, so the box is exactly the axis-aligned bounds of the drawn vertices rather than a transformed local box, which would overestimate under rotation.
 * @evidence contracts/common.md#clear-and-simple-design One placed-bounds rule for element, element-part and instance descriptions, which previously each built a transformed point array and then a box.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or transform is special-cased; an empty point list is null rather than a fabricated box.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the composition order, that no copy is built, the units, the empty case, and that the result is new.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the n points, O(n) time and O(1) extra space beyond one placed point at a time, replacing a mapped copy of every placed point.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure measurement of one point list under one transform; the subject describer shares the model-frame points across placements.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates the matrix, one placed point per step and the returned box, and retains nothing.
 */
export const autoMovieSubjectPlacedBounds = (
  points: readonly IAutoMovieVector3[],
  transform: IAutoMovieTransform,
): IAutoMovieSubjectBox | null => {
  if (points.length === 0) return null;
  const matrix: number[] = Matrix4.compose(
    transform.translation,
    transform.rotation,
    transform.scale,
  );
  const first: IAutoMovieVector3 = transformAutoMovieDrawingPoint(
    matrix,
    points[0]!,
  );
  const min: IAutoMovieVector3 = { ...first };
  const max: IAutoMovieVector3 = { ...first };
  for (const point of points) {
    const placed: IAutoMovieVector3 = transformAutoMovieDrawingPoint(
      matrix,
      point,
    );
    min.x = Math.min(min.x, placed.x);
    min.y = Math.min(min.y, placed.y);
    min.z = Math.min(min.z, placed.z);
    max.x = Math.max(max.x, placed.x);
    max.y = Math.max(max.y, placed.y);
    max.z = Math.max(max.z, placed.z);
  }
  return { min, max };
};
