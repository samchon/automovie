import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One subject's deterministic measurements at a shot's two edited boundaries.
 *
 * The production film-grammar pass measures each scene node a shot contract
 * requires readable through the same `nodeSubjectExtent`, `nodeSubjectBox` and
 * `framedBoxOf` reads the camera solve uses, so the edit is judged on the box
 * the camera was aimed at. `readFilmGrammar` throws when the id is blank or
 * repeated in the shot, a point is not finite, `height` is not finite and
 * positive, `radius` is negative or not finite, or an eyeline target id is
 * blank.
 */
export interface IAutoMovieGrammarSubjectObservation {
  /** Scene-node or formation id, non-blank and unique within the shot. */
  id: string;

  /** World bottom-centre point of the subject at the first shown frame. */
  start: IAutoMovieVector3;

  /** World bottom-centre point of the subject at the last shown frame. */
  end: IAutoMovieVector3;

  /** World-space subject height in metres; finite and positive. */
  height: number;

  /**
   * Half the subject's horizontal diagonal in metres, or 0 when nothing
   * horizontal could be measured.
   *
   * The same number {@link IAutoMovieFramedBox.radius} states, read here for the
   * reason the framing solve reads it: a subject wider than the frame can hold
   * at its height is placed by its width, so a shot size measured from the
   * height alone would report a looser framing than the camera delivered. In a
   * landscape raster a standing figure's radius decides nothing; a 60 m
   * facade's decides the size.
   */
  radius: number;

  /** Resolved gaze over the shot, or null when it is not observed. */
  eyeline: {
    /** Semantic target id, kept even when the target is outside the frame. */
    target: string;

    /** World gaze target point at the first shown frame. */
    start: IAutoMovieVector3;

    /** World gaze target point at the last shown frame. */
    end: IAutoMovieVector3;
  } | null;
}
