import {
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEngineDrawingEpsilon } from "../AutoMovieEngineDrawingEpsilon";

/*
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
 * Parameter view: The authored view.
 * Returns: The page basis with unit `right`, `up` and `normal` axes.
 */
export const drawingFrame = (
  view: IAutoMovieDrawingView,
): IAutoMovieDrawingFrame => {
  if (AutoMovieEngineVector3.length(view.direction) <= AutoMovieEngineDrawingEpsilon)
    throw new Error(`drawing view "${view.id}" direction must be non-zero`);
  if (AutoMovieEngineVector3.length(view.up) <= AutoMovieEngineDrawingEpsilon)
    throw new Error(`drawing view "${view.id}" up must be non-zero`);
  if (view.scale <= 0)
    throw new Error(
      `drawing view "${view.id}" scale must be a finite number > 0, but was ${view.scale}`,
    );
  requireOptionalDepth(view.depth, `drawing view "${view.id}" depth`);
  requireOptionalDepth(view.overhead, `drawing view "${view.id}" overhead`);

  const normal: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.scale(view.direction, -1),
  );
  const raw: IAutoMovieVector3 = AutoMovieEngineVector3.cross(view.up, normal);
  if (AutoMovieEngineVector3.length(raw) <= AutoMovieEngineDrawingEpsilon)
    throw new Error(
      `drawing view "${view.id}" up must not be parallel to its direction`,
    );
  const right: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(raw);
  const up: IAutoMovieVector3 = AutoMovieEngineVector3.cross(normal, right);
  return {
    origin: view.origin,
    right:
      view.projection === "reflected-ceiling-plan"
        ? AutoMovieEngineVector3.scale(right, -1)
        : right,
    up,
    normal,
  };
};

/*
 * Throw unless `value` is `null` or a finite number at or above zero.
 */
const requireOptionalDepth = (value: number | null, label: string): void => {
  if (value !== null && value < 0)
    throw new Error(
      `${label} must be null or a finite number at or above zero, but was ${value}`,
    );
};
