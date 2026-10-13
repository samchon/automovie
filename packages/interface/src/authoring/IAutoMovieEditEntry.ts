import { IAutoMovieTransition } from "../cinematics/IAutoMovieTransition";
import { IAutoMovieTrim } from "../cinematics/IAutoMovieTrim";

/**
 * One shot placement in the finished edit.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors an OpenTimelineIO clip placement; `cutSequence` requires a built shot, a trim with positive duration inside the shot, no transition on the first entry, and a transition no longer than either adjacent played span.
 * @evidence contracts/common.md#clear-and-simple-design Field for field identical to `IAutoMovieSequenceEntry`, which `cutSequence` copies it into, so the authoring and artifact layers duplicate one shape instead of sharing it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased by shot id; an invalid trim is refused with its overshoot instead of being clamped, and an entry naming an unbuilt shot resets the adjacent-transition bookkeeping.
 * @evidence contracts/common.md#meaningful-documentation Documents that `shot` must name a compiled shot, that a null trim plays the whole shot, and that a null transition is a hard cut that the first entry must use.
 * @author Samchon
 */
export interface IAutoMovieEditEntry {
  /** Existing compiled shot identity. */
  shot: string;

  /**
   * Positive-duration source subrange inside the shot, or null to play the
   * whole shot.
   */
  trim: IAutoMovieTrim | null;

  /**
   * Incoming transition, or null for a hard cut; the first entry must be
   * null.
   */
  transition: IAutoMovieTransition | null;
}
