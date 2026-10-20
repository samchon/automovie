import { AutoMovieDrawingTargetStatus } from "./AutoMovieDrawingTargetStatus";
import { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/**
 * One dimension as the drawing resolved it.
 *
 * It is resolved when both ends resolve and stale otherwise; a stale dimension
 * carries no geometry and the reason of its first failing end, checking `from`
 * before `to`.
 *
 * @evidence contracts/common.md#principled-implementation Both ends go through `resolveAutoMovieDrawingFeature`; a `page` value is the Euclidean distance between the two rounded page points, a `world` value the length of the difference of the unrounded world points, and either is rounded to six decimals.
 * @evidence contracts/common.md#clear-and-simple-design The record copies the spec's id and measure and adds outcome, endpoints and value, so the serializer draws the line and the reader checks the number without the view.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One stale end makes the whole dimension stale with no partial geometry, rather than drawing half a dimension or reusing a previous value.
 * @evidence contracts/common.md#meaningful-documentation States when the record is stale and which reason it carries, the units and rounding of points and value, what each measure computes, and when each member is null.
 */
export interface IAutoMovieDrawingDimension {
  /** Dimension id, copied from the view. */
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

  /** Exactly why an end no longer resolves, or `null` when resolved. */
  reason: string | null;
}
