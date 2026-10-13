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
 * @evidence contracts/common.md#principled-implementation `validateBuiltEnvironment` resolves the element under the opening's fill, records it in one work-wide driven table shared with connector carriages, requires positive finite extents and a valid travel, and tests the rest-pose rectangle's projected corners against the void hull with the same polygon containment a void gets against its face.
 * @evidence contracts/common.md#clear-and-simple-design The panel names an element, a leaf size, and one motion; the element hierarchy supplies placement and chaining, so a folding leaf is another panel parented under the first rather than a new record kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A second driver for one element is refused rather than letting the last displacement win, and a leaf larger than its void is refused instead of being clipped; depth off the face plane is deliberately not compared.
 * @evidence contracts/common.md#meaningful-documentation States the local frame of axis, pivot, and leaf rectangle, the natural door authoring, the rest-pose fit rule against the void hull, the one-driver rule, where the element must sit, and the units of the extents.
 * @author Samchon
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
