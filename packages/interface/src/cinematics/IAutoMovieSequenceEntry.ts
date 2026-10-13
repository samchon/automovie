import { IAutoMovieTransition } from "./IAutoMovieTransition";
import { IAutoMovieTrim } from "./IAutoMovieTrim";

/**
 * One shot's placement in a sequence: an optional trim and incoming transition.
 *
 * @evidence contracts/common.md#principled-implementation `sequenceTimeline` resolves an entry into a start, a played span (`trim.duration` or the whole shot duration) and a source offset (`trim.start` or 0), the OTIO clip-with-source-range reading.
 * @evidence contracts/common.md#clear-and-simple-design Three fields matching an OTIO clip placement with an incoming transition; the authoring-side `IAutoMovieEditEntry` has the same shape and `cutSequence` copies its fields across one to one.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Production's `validateSequenceArtifact` re-checks stored entries, including that two adjacent transitions cannot overlap inside one played span, because a persisted sequence need not have passed `cutSequence`.
 * @evidence contracts/common.md#meaningful-documentation States that `shot` is a shot id, the seconds unit and `source_range` analogy of `trim`, and the null meanings of trim and transition, including that the first entry has none.
 * @author Samchon
 */
export interface IAutoMovieSequenceEntry {
  /** Id of the {@link IAutoMovieShot} played here. */
  shot: string;

  /**
   * Trim into the shot (seconds), the OTIO `source_range` analogue, or `null`
   * to play the whole shot.
   */
  trim: IAutoMovieTrim | null;

  /**
   * Blend into this entry from the previous one, or `null` for a hard cut (the
   * default). The first entry has no previous one, so it must be `null`.
   */
  transition: IAutoMovieTransition | null;
}
