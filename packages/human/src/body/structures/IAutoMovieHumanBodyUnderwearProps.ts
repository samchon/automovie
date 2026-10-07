import type { IAutoMovieHumanBodyPosedSurface } from "./IAutoMovieHumanBodyPosedSurface";
import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";
import type { IAutoMovieHumanBodyUnderwearRest } from "./IAutoMovieHumanBodyUnderwearRest";

/**
 * What the compiled underwear builder reads per document: the garment asked
 * for, the body at rest and its posed surfaces.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyUnderwearProps {
  /** The garment the document wears. */
  underwear: IAutoMovieHumanBodyUnderwear;

  /** The document's body at rest. */
  rest: IAutoMovieHumanBodyUnderwearRest;

  /** The posed surfaces, in basis surface order. */
  posed: IAutoMovieHumanBodyPosedSurface[];
}
