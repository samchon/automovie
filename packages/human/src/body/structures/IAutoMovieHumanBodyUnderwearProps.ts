import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";

/**
 * One admitted garment choice and the body's shaped rest coverage authority.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearProps {
  /** Closed style and optional linear fabric colour. */
  underwear: IAutoMovieHumanBodyUnderwear;

  /** Source-aligned shaped rest positions and landmarks. */
  rest: IAutoMovieHumanBodyUnderwearRest;
}
