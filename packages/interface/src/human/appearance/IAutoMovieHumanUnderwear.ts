import type { AutoMovieHumanLowerUnderwear } from "../AutoMovieHumanLowerUnderwear";
import type { AutoMovieHumanUpperUnderwear } from "../AutoMovieHumanUpperUnderwear";

/**
 * Basic underwear, as a lower and an upper garment and one colour.
 *
 * Both garment choices are explicit; this declaration supplies no defaults or
 * viewer behavior.
 */
export interface IAutoMovieHumanUnderwear {
  /** Lower garment. */
  bottom: AutoMovieHumanLowerUnderwear;

  /** Upper garment. */
  top: AutoMovieHumanUpperUnderwear;

  /**
   * Garment colour as an sRGB hex `#RRGGBB`. Schema constraints: Pattern:
   * "^#[0-9A-Fa-f]{6}$"; retained by Human's schema refinement.
   */
  color: string;
}
