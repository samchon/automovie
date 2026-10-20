import { IAutoMovieTravelMotion } from "./IAutoMovieTravelMotion";

/**
 * One member that travels on a single degree of freedom.
 *
 * The panel drives a visible element, and that element's own local transform is
 * its rest pose, so a panel adds motion to the hierarchy rather than a second
 * way of placing the same thing. Both the axis and the pivot are written in the
 * element's own local frame, and the leaf occupies the element-local rectangle
 * from the origin to `(width, height)` in that frame's XY plane: a hinge at the
 * local origin with the leaf running along `+X` is therefore the natural way to
 * author a door, and the swept envelope is measured from exactly that
 * rectangle.
 *
 * When the opening states a profile on a host face, that rectangle at rest,
 * projected into the face's own plane, must lie inside the straight hull of the
 * opening's void. One element carries one displacement, so no other panel or
 * carriage in the work may drive it.
 *
 * @evidence contracts/common.md#principled-implementation Admission resolves the driven element under the fill, enforces work-wide unique displacement ownership with carriages, positive finite extents and valid travel. When a usable profile/host face exists, the rest rectangle is transformed, projected to face XY and checked by the shared approximate polygon predicate against the straight arc-envelope hull. This measures the authored rectangle, not all visible mesh vertices or every operating-state collision.
 * @evidence contracts/common.md#clear-and-simple-design The panel names an element, a leaf size, and one motion; the element hierarchy supplies placement and chaining, so a folding leaf is another panel parented under the first rather than a new record kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A second element driver and an observed rest-rectangle fit failure are refused instead of overwritten or clipped. Fit discards depth and is skipped without a usable profile/face; an arc-envelope hull may contain space outside the authored arc. Sweeping varies only this panel's travel with ancestors at their current state, not every configuration of a folding chain.
 * @evidence contracts/common.md#meaningful-documentation States the local frame of axis, pivot, and leaf rectangle, the natural door authoring, the rest-pose fit rule against the void hull, the one-driver rule, where the element must sit, and the units of the extents.
 */
export interface IAutoMovieMovablePanel {
  /** Stable, non-blank panel identity, unique within the opening. */
  id: string;

  /**
   * Visible element this panel drives; its local transform is the rest pose.
   *
   * It is the opening's own {@link IAutoMovieBuiltOpening.fill} or an element
   * below it, so a panel can only move part of the thing that fills the hole.
   */
  element: string;

  /** Finite positive leaf extent along the element's local X, in metres. */
  width: number;

  /** Finite positive leaf extent along the element's local Y, in metres. */
  height: number;

  /** The one degree of freedom this panel travels on. */
  motion: IAutoMovieTravelMotion;
}
