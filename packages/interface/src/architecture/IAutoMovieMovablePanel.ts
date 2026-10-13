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
 */
export interface IAutoMovieMovablePanel {
  /** Stable panel identity within the opening. */
  id: string;

  /**
   * Visible element this panel drives; its local transform is the rest pose.
   *
   * It is the opening's own {@link IAutoMovieBuiltOpening.fill} or an element
   * below it, so a panel can only move part of the thing that fills the hole.
   */
  element: string;

  /** Positive leaf extent along the element's local X, in metres. */
  width: number;

  /** Positive leaf extent along the element's local Y, in metres. */
  height: number;

  /** The one degree of freedom this panel travels on. */
  motion: IAutoMovieTravelMotion;
}
