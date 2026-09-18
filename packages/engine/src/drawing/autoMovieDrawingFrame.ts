import { IAutoMovieDrawingFrame, IAutoMovieDrawingView, IAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "../math/Vector3";
import { AUTOMOVIE_DRAWING_EPSILON } from "./AUTOMOVIE_DRAWING_EPSILON";

/**
 * Resolve one view's orthonormal page basis.
 *
 * The rule is one rule for every projection: the plane normal points back at
 * the viewer, the page right axis is `up x normal`, and the page up axis is
 * re-orthogonalized as `normal x right` so an author may write a nearby
 * cardinal direction instead of an exact in-plane vector.
 *
 * A reflected ceiling plan then negates the page right axis, and that single
 * negation is the whole of the reflection: with it, a coffer at a world point
 * lands on the same page point in the ceiling plan as the column under it does
 * in the floor plan, so the two sheets can be laid over one another. Without
 * it, looking up would mirror the building and every reader would have to undo
 * the mirror in their head.
 *
 * A degenerate view — zero direction, zero up, or an up parallel to the
 * direction — throws rather than silently producing a basis that is not a
 * basis.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Establishes the validated page basis that makes each authored view direction, scale, and reflected-ceiling orientation reproducible.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Validates view vectors and depths, derives an orthonormal right-up-normal frame, and reflects only the ceiling-plan right axis.
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

  const normal = Vector3.normalize(Vector3.scale(view.direction, -1));
  const raw = Vector3.cross(view.up, normal);
  if (Vector3.length(raw) <= AUTOMOVIE_DRAWING_EPSILON)
    throw new Error(
      `drawing view "${view.id}" up must not be parallel to its direction`,
    );
  const right = Vector3.normalize(raw);
  const up = Vector3.cross(normal, right);
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

const requireFiniteVector = (value: IAutoMovieVector3, label: string): void => {
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  )
    throw new Error(`${label} must be finite on every axis`);
};

const requireOptionalDepth = (value: number | null, label: string): void => {
  if (value !== null && (!Number.isFinite(value) || value < 0))
    throw new Error(
      `${label} must be null or a finite number at or above zero, but was ${value}`,
    );
};
