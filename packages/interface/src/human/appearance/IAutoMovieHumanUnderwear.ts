import type { AutoMovieHumanLowerUnderwear } from "../AutoMovieHumanLowerUnderwear";
import type { AutoMovieHumanUpperUnderwear } from "../AutoMovieHumanUpperUnderwear";

/**
 * Basic underwear, as a lower and an upper garment and one colour.
 *
 * Both garment choices are explicit; this declaration supplies no defaults or viewer behavior.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Basic underwear, as a lower and an upper garment and one colour.
 * @evidence contracts/development/design.md#principled-representation `bottom`: Lower garment. `top`: Upper garment. `color`: Garment colour as an sRGB hex `#RRGGBB`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanUnderwear is the canonical exchange used by IAutoMovieHumanUnderwearSchema, IAutoMovieHumanAppearance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `bottom`, `top`, `color`; callers supply the complete record.
 */
export interface IAutoMovieHumanUnderwear {
  /** Lower garment. */
  bottom: AutoMovieHumanLowerUnderwear;

  /** Upper garment. */
  top: AutoMovieHumanUpperUnderwear;

  /** Garment colour as an sRGB hex `#RRGGBB`. Schema constraints: Pattern: "^#[0-9A-Fa-f]{6}$"; retained by Human's schema refinement. */
  color: string;
}
