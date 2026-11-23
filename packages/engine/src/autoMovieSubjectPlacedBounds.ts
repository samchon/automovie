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
 * moved through it, and the componentwise minimum and maximum are folded as the
 * points are placed, so no placed copy of the point list is built. Units follow
 * the points and the translation, metres for every subject.
 *
 * @param points Model-frame points, typically a model's or a part's vertices.
 * @param transform Placement of the model in world space.
 * @returns The axis-aligned box of the placed points, new and caller-owned.
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
