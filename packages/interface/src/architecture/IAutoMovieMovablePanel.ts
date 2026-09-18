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
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-envelope-continuity Exposes `IAutoMovieMovablePanel` as the portable data boundary for the building envelope continuity requirement.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-envelope-continuity-invariant Types `IAutoMovieMovablePanel` for the building envelope envelope continuity invariant system contract.
 */
export interface IAutoMovieMovablePanel {
  /**
   * Stable panel identity within the opening.
   *
   * @evidence requirements/building-exterior/structure-and-envelope.md#building-envelope-continuity Exposes `id` as the portable data boundary for the building envelope continuity requirement.
   * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-envelope-continuity-invariant Types `id` for the building envelope envelope continuity invariant system contract.
   */
  id: string;

  /**
   * Visible element this panel drives; its local transform is the rest pose.
   *
   * It is the opening's own {@link IAutoMovieBuiltOpening.fill} or an element
   * below it, so a panel can only move part of the thing that fills the hole.
   *
   * @evidence requirements/building-exterior/structure-and-envelope.md#building-envelope-continuity Exposes `element` as the portable data boundary for the building envelope continuity requirement.
   * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-envelope-continuity-invariant Types `element` for the building envelope envelope continuity invariant system contract.
   */
  element: string;

  /**
   * Positive leaf extent along the element's local X, in metres.
   *
   * @evidence requirements/building-exterior/structure-and-envelope.md#building-envelope-continuity Exposes `width` as the portable data boundary for the building envelope continuity requirement.
   * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-envelope-continuity-invariant Types `width` for the building envelope envelope continuity invariant system contract.
   */
  width: number;

  /**
   * Positive leaf extent along the element's local Y, in metres.
   *
   * @evidence requirements/building-exterior/structure-and-envelope.md#building-envelope-continuity Exposes `height` as the portable data boundary for the building envelope continuity requirement.
   * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-envelope-continuity-invariant Types `height` for the building envelope envelope continuity invariant system contract.
   */
  height: number;

  /**
   * The one degree of freedom this panel travels on.
   *
   * @evidence requirements/building-exterior/structure-and-envelope.md#building-envelope-continuity Exposes `motion` as the portable data boundary for the building envelope continuity requirement.
   * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-envelope-continuity-invariant Types `motion` for the building envelope envelope continuity invariant system contract.
   */
  motion: IAutoMovieTravelMotion;
}
