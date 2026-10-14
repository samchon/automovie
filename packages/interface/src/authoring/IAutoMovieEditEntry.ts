import { IAutoMovieTransition } from "../cinematics/IAutoMovieTransition";
import { IAutoMovieTrim } from "../cinematics/IAutoMovieTrim";

/**
 * One shot placement in the finished edit.
 *
 * An entry plays a span of an already built shot: the trimmed span or the whole shot. Its incoming transition overlaps the previous entry's tail, so the overlap is bounded by both played spans. The same shot may appear in several entries.
 *
 * @evidence contracts/common.md#principled-implementation `cutSequence` resolves `shot` by id among the built shots, takes the played span as the trim's duration or the whole shot's duration, refuses a trim outside `[0, shot.duration]` and a transition on the first entry, longer than either adjacent played span, or overlapping the previous entry's own incoming transition, and subtracts each accepted transition from the summed runtime.
 * @evidence contracts/common.md#clear-and-simple-design An entry is a shot reference plus two nullable edits, with the trim and transition shapes owned by the cinematics types the sequence also uses, so `cutSequence` copies them onto the sequence unchanged.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A trim or transition that does not fit is refused with its overshoot rather than clamped to the shot, and an unbuilt shot id is refused rather than skipped.
 * @evidence contracts/common.md#meaningful-documentation States what `shot` must name, what a null trim and a null transition mean, the trim bounds, every bound on a transition's duration, and that a shot may repeat.
 * @author Samchon
 */
export interface IAutoMovieEditEntry {
  /** Non-blank id of a shot the pipeline built and passed to `cutSequence`. */
  shot: string;

  /**
   * Positive-duration span inside [0, shot.duration] to play, or null to play the whole shot.
   */
  trim: IAutoMovieTrim | null;

  /**
   * Incoming transition, or null for a hard cut. The first entry must use null; otherwise its duration may not exceed either adjacent played span, and together with the previous entry's incoming transition may not exceed that previous span.
   */
  transition: IAutoMovieTransition | null;
}
