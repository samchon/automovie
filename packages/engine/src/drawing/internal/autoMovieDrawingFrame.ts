import {
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AUTOMOVIE_DRAWING_EPSILON } from "../AUTOMOVIE_DRAWING_EPSILON";

/**
 * Validate one view's placement and resolve its orthonormal page basis.
 *
 * One rule serves every projection: the plane normal points back at the viewer
 * (`-direction`, normalized), the page right axis is `up x normal`, and the
 * page up axis is re-orthogonalized as `normal x right`, so an author may write
 * a nearby cardinal direction instead of an exact in-plane vector. The origin
 * is the view's own origin and is where the cut plane passes.
 *
 * A reflected ceiling plan negates the page right axis, and that single
 * negation is the whole reflection: a coffer then lands on the same page point
 * as the column under it does in the floor plan, so the two sheets overlay.
 *
 * Throws an `Error` naming the view for a non-finite or zero direction or up,
 * an up parallel to the direction, a non-finite origin, a scale that is not a
 * finite positive number, and a `depth` or `overhead` that is neither `null`
 * nor a finite non-negative number.
 *
 * @param view The authored view.
 * @returns The page basis with unit `right`, `up` and `normal` axes.
 */
export const autoMovieDrawingFrame = (
  view: IAutoMovieDrawingView,
): IAutoMovieDrawingFrame => {
  if (Vector3.length(view.direction) <= AUTOMOVIE_DRAWING_EPSILON)
    throw new Error(`drawing view "${view.id}" direction must be non-zero`);
  if (Vector3.length(view.up) <= AUTOMOVIE_DRAWING_EPSILON)
    throw new Error(`drawing view "${view.id}" up must be non-zero`);
  if (view.scale <= 0)
    throw new Error(
      `drawing view "${view.id}" scale must be a finite number > 0, but was ${view.scale}`,
    );
  requireOptionalDepth(view.depth, `drawing view "${view.id}" depth`);
  requireOptionalDepth(view.overhead, `drawing view "${view.id}" overhead`);

  const normal: IAutoMovieVector3 = Vector3.normalize(
    Vector3.scale(view.direction, -1),
  );
  const raw: IAutoMovieVector3 = Vector3.cross(view.up, normal);
  if (Vector3.length(raw) <= AUTOMOVIE_DRAWING_EPSILON)
    throw new Error(
      `drawing view "${view.id}" up must not be parallel to its direction`,
    );
  const right: IAutoMovieVector3 = Vector3.normalize(raw);
  const up: IAutoMovieVector3 = Vector3.cross(normal, right);
  return {
    origin: view.origin,
    right:
      view.projection === "reflected-ceiling-plan"
        ? Vector3.scale(right, -1)
        : right,
    up,
    normal,
  };
};

/** Throw unless `value` is `null` or a finite number at or above zero. */
const requireOptionalDepth = (value: number | null, label: string): void => {
  if (value !== null && value < 0)
    throw new Error(
      `${label} must be null or a finite number at or above zero, but was ${value}`,
    );
};
