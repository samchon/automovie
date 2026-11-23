import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An axis-aligned world box restated as the base, height and radius the framing
 * grammar solves a camera distance and an aim height from.
 *
 * {@link framedBoxOf} produces it from an {@link IAutoMovieSubjectBox}:
 * `performShot` reads it for every node and group subject before building an
 * {@link IAutoMovieFramedSubject}, and the production film-grammar pass reads
 * the same box for each required subject, so the edit is judged on the subject
 * the camera was solved for.
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
