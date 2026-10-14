import {
  IAutoMovieClip,
  IAutoMovieInteractionEvent,
  IAutoMovieValidation,
} from "@automovie/interface";

/**
 * Advice, fall events and an optional trajectory returned by detectFreeFall.
 *
 * @evidence contracts/common.md#principled-implementation The canonical detector keeps validation separate from generated time-zero fall advice; invalid duration/margin produces an error with no suggested arc, and supported/attached/falling bodies produce no fall suggestion.
 * @evidence contracts/common.md#clear-and-simple-design One outcome joins physical advice and the corresponding interaction event without turning a warning into a failed authored model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A trajectory is proposed only when the detector expects unsupported free fall; the record does not claim a host applied it or a collider-free path was proved.
 * @evidence contracts/common.md#meaningful-documentation Names the producer, warning/error distinction, shot-clock events and nullable suggested clip; generated trajectory failures may still propagate from the detector.
 * @evidence contracts/performance.md#efficient-algorithms This record performs no projectile sampling; duration, frame population and trajectory costs belong to detectFreeFall and projectileTrajectory.
 * @evidence contracts/performance.md#reuse-equivalent-work The same detector outcome supplies its event and trajectory without an independent cached physical verdict in this wrapper.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned findings, events and clip; event points may borrow the supplied center-of-mass reference, and the wrapper acquires no playback task.
 * @author Samchon
 */
export interface IAutoMovieFreeFallResult {
  /** Warning-severity feedback (or an error for bad input). */
  validation: IAutoMovieValidation;

  /** Fall events on the shot clock: "one calculation, two consumers". */
  events: IAutoMovieInteractionEvent[];

  /**
   * Suggested free-fall arc from this frame, or `null` when not expected to
   * fall.
   */
  trajectory: IAutoMovieClip | null;
}
