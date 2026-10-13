import { IAutoMovieTransition } from "./IAutoMovieTransition";
import { IAutoMovieTrim } from "./IAutoMovieTrim";

/**
 * One shot's placement in a sequence: an optional trim and incoming transition.
 *
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
