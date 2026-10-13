import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One dimension as the drawing resolved it.
 *
 * It is resolved when both ends resolve and stale otherwise; a stale dimension
 * carries no geometry and the reason of its first failing end, checking `from`
 * before `to`.
 *
 * @evidence contracts/common.md#principled-implementation `world` takes the Euclidean length between the two resolved world points and `page` takes `Math.hypot` over the rounded page points, so the page figure inherits the six-decimal rounding of its endpoints.
 * @evidence contracts/common.md#clear-and-simple-design One record per authored spec with nullable geometry, so resolved and stale dimensions share one shape and keep the view's order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts When both ends are stale only the `from` reason is reported, a stated simplification, and a stale end is never approximated by a nearby feature.
 * @evidence contracts/common.md#meaningful-documentation States both measure meanings and their unit, the rounding of points and value, the stale condition, and which reason a stale dimension carries.
 * @author Samchon
 */
export interface IAutoMovieDrawingDimension {
  /** Dimension identity, as authored. */
  id: string;

  /**
   * Which distance `value` is: `page` is the in-plane distance between the
   * rounded page points, `world` the true 3D distance between the resolved
   * feature points. Both are metres before drafting scale.
   */
  measure: "page" | "world";

  /** Whether both ends resolved. */
  status: AutoMovieDrawingTargetStatus;

  /** Page start point in metres, or `null` when stale. */
  from: IAutoMovieDrawingPoint | null;

  /** Page end point in metres, or `null` when stale. */
  to: IAutoMovieDrawingPoint | null;

  /**
   * Measured distance in metres, rounded to six decimals, or `null` when stale.
   */
  value: number | null;

  /** Exactly why the target no longer resolves, or `null` when resolved. */
  reason: string | null;
}
