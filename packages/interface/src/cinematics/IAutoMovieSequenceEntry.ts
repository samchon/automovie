import { IAutoMovieTransition } from "./IAutoMovieTransition";
import { IAutoMovieTrim } from "./IAutoMovieTrim";

/**
 * One shot's placement in a sequence: the shot it plays, an optional trim, and
 * an optional incoming transition.
 *
 * The entry's played span is its trim's duration, else the whole shot, and its
 * output start is the previous entry's end minus the incoming transition's
 * duration.
 *
 * @evidence contracts/common.md#principled-implementation `sequenceTimeline` reads `trim.start` as the source offset and `trim.duration` (else the shot duration) as the played span, and subtracts `transition.duration` from the running cursor to place the entry, mirroring the OpenTimelineIO `source_range` and transition model.
 * @evidence contracts/common.md#clear-and-simple-design A shot id plus two nullable modifiers covers every placement; the shot itself is referenced, not copied, so a retimed shot needs no entry edit beyond its trim.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A transition on the first entry is refused by `cutSequence` and thrown by `sequenceTimeline` rather than silently dropped, and an unknown shot id is refused rather than skipped.
 * @evidence contracts/common.md#meaningful-documentation States how the played span and output start follow from the fields, what each `null` means, and that the first entry may not carry a transition.
 * @author Samchon
 */
export interface IAutoMovieSequenceEntry {
  /** Id of the {@link IAutoMovieShot} played here; it must name a built shot. */
  shot: string;

  /**
   * Trim into the shot in seconds, the OpenTimelineIO `source_range`
   * analogue, or `null` to play the whole shot.
   */
  trim: IAutoMovieTrim | null;

  /**
   * Blend into this entry from the previous one, or `null` for a hard cut (the
   * default). The first entry has no previous one, so it must be `null`.
   */
  transition: IAutoMovieTransition | null;
}
