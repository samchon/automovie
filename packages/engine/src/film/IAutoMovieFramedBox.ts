import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * An axis-aligned world box restated as the base, height and radius the framing
 * grammar solves a camera distance and an aim height from.
 *
 * {@link framedBoxOf} produces it from an {@link IAutoMovieSubjectBox}:
 * `performShot` reads it for every node and group subject before building an
 * {@link IAutoMovieFramedSubject}, and the production film-grammar pass reads
 * the same box for each required subject, so the edit is judged on the subject
 * the camera was solved for.
 *
 * @evidence contracts/development/design.md#principled-representation `base` is the box's bottom centre, `height` its vertical span, and `radius` half its horizontal diagonal, the widest horizontal half-span over every camera bearing, so a distance fitted to it holds the subject from any side an orbit sweeps; the premise is an axis-aligned box with `max >= min`, which every subject-box builder returns.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three fields are all the solve reads from geometry, so the solve and the grammar observation consume the same reduced shape instead of each re-deriving centre, span and diagonal from the box.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No subject kind gets a different reduction: a figure, a facade and a formation are all reduced by the same three formulas, and a degenerate box yields a zero height or radius instead of an invented one.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, both consumers, that `base` is the bottom centre rather than a member centroid, that `radius` is half the horizontal diagonal, and the metre units.
 */
export interface IAutoMovieFramedBox {
  /**
   * World point at the bottom centre of the box, in metres: the horizontal
   * middle of what is drawn at the height of its lowest point.
   */
  base: IAutoMovieVector3;

  /** Vertical span of the box in metres; zero for a flat box. */
  height: number;

  /** Half the box's horizontal diagonal in metres; zero for a vertical segment. */
  radius: number;
}
