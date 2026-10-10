import type { IAutoMovieHumanPersonPerformedSkin } from "./IAutoMovieHumanPersonPerformedSkin";
import type { IAutoMovieHumanPersonSourceNormalReference } from "./IAutoMovieHumanPersonSourceNormalReference";

/**
 * The current performed skin a source normal field is evaluated for, with the
 * final reference skin that normal transport requires. The current-only path
 * ignores the reference.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceNormalInput extends IAutoMovieHumanPersonPerformedSkin {
  /** The final reference skin, required by normal transport. */
  reference?: IAutoMovieHumanPersonSourceNormalReference;
}
