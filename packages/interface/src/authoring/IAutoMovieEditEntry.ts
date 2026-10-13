import { IAutoMovieTransition } from "../cinematics/IAutoMovieTransition";
import { IAutoMovieTrim } from "../cinematics/IAutoMovieTrim";

/** One shot placement in the finished edit. */
export interface IAutoMovieEditEntry {
  /** Existing compiled shot identity. */
  shot: string;

  /** Optional positive source subrange. */
  trim: IAutoMovieTrim | null;

  /** Incoming transition, or null for a hard cut. */
  transition: IAutoMovieTransition | null;
}
