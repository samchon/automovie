import { IAutoMovieTransition } from "../cinematics/IAutoMovieTransition";
import { IAutoMovieTrim } from "../cinematics/IAutoMovieTrim";

/**
 * One shot placement in the finished edit.
 *
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
