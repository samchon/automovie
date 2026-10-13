import { IAutoMovieVector3 } from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation Shot size is the larger of the vertical occupancy, the projected span between `start` and a point `height` above it, and the horizontal occupancy `radius / (depth * tan(fovY / 2) * aspect)`, mirroring the two-axis fit the camera solve took the larger of; screen direction and cut angle are read from the boundary points.
 * @evidence contracts/common.md#clear-and-simple-design Carries two boundary points, two extents and an optional eyeline, the minimum every grammar check reads, so the analyzer needs no scene, model or clip.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject kind is special-cased: a figure and a facade are both measured by height and radius, and an unobserved eyeline is stated as null, which skips the eyeline check, rather than being assumed level or forward.
 * @evidence contracts/common.md#meaningful-documentation States the producer and why it shares the camera solve's measurement, the failure effect of each malformed field, the metre units, the bottom-centre convention of the points, when `radius` decides the size, and what a null eyeline means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A measurement record; the analyzer projects each boundary point a constant number of times per check, and builds an id map per shot to find the primary subject, answered on `readFilmGrammar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built per placed shot by the caller for one reading; nothing caches it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two to four vectors, two numbers and an id, owned by the shot observation.
 * @author Samchon
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
   * The same number {@link IAutoMovieFramedBox.radius} states, read here for
   * the reason the framing solve reads it: a subject wider than the frame can
   * hold at its height is placed by its width, so a shot size measured from
   * the height alone would report a looser framing than the camera delivered.
   * In a landscape raster a standing figure's radius decides nothing; a 60 m
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
