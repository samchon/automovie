import {
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingView,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { AUTOMOVIE_DRAWING_EPSILON } from "./constants/AUTOMOVIE_DRAWING_EPSILON";

/**
 * Validate one view's placement and resolve its orthonormal page basis.
 *
 * One rule serves every projection: the plane normal points back at the
 * viewer (`-direction`, normalized), the page right axis is `up x normal`, and
 * the page up axis is re-orthogonalized as `normal x right`, so an author may
 * write a nearby cardinal direction instead of an exact in-plane vector. The
 * origin is the view's own origin and is where the cut plane passes.
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
 *
 * @evidence contracts/common.md#principled-implementation Builds a right-handed orthonormal basis by two cross products after normalizing the viewing direction, which is exact up to rounding whenever up and direction are non-zero and not parallel, the premises the guards establish; the reflection is a single axis negation, which mirrors the page about its up axis.
 * @evidence contracts/common.md#clear-and-simple-design One function owns both the placement checks every drawing derivation needs and the basis they protect, so no caller can resolve a frame from an unchecked view; the vector and depth checks are private helpers shared by the three vector and two depth fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projections differ only by the documented ceiling-plan negation; a degenerate view throws instead of falling back to a default axis.
 * @evidence contracts/common.md#meaningful-documentation The comment states the axis construction, the origin's role, the reflection and its purpose, every refused input and the failure type, and that the returned axes are unit vectors.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Constant time: a fixed number of checks, two cross products and two normalizations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per derived drawing for its one view, so there is no repeated request to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns four small vectors owned by the caller and keeps nothing.
 * @author Samchon
 */
export const autoMovieDrawingFrame = (
  view: IAutoMovieDrawingView,
): IAutoMovieDrawingFrame => {
  requireFiniteVector(view.direction, `drawing view "${view.id}" direction`);
  requireFiniteVector(view.up, `drawing view "${view.id}" up`);
  if (Vector3.length(view.direction) <= AUTOMOVIE_DRAWING_EPSILON)
    throw new Error(`drawing view "${view.id}" direction must be non-zero`);
  if (Vector3.length(view.up) <= AUTOMOVIE_DRAWING_EPSILON)
    throw new Error(`drawing view "${view.id}" up must be non-zero`);
  requireFiniteVector(view.origin, `drawing view "${view.id}" origin`);
  if (!Number.isFinite(view.scale) || view.scale <= 0)
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

/** Throw unless every axis of `value` is finite. */
const requireFiniteVector = (value: IAutoMovieVector3, label: string): void => {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  )
    throw new Error(`${label} must be finite on every axis`);
};

/** Throw unless `value` is `null` or a finite number at or above zero. */
const requireOptionalDepth = (value: number | null, label: string): void => {
  if (value !== null && (!Number.isFinite(value) || value < 0))
    throw new Error(
      `${label} must be null or a finite number at or above zero, but was ${value}`,
    );
};
