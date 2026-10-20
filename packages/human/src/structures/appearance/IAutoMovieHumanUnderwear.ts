import { tags } from "typia";

import { AutoMovieHumanLowerUnderwear } from "../../typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear } from "../../typings/AutoMovieHumanUpperUnderwear";

/**
 * Basic underwear, as a lower and an upper garment and one colour.
 *
 * Both garment choices are explicit; this declaration supplies no defaults or viewer behavior.
 */
export interface IAutoMovieHumanUnderwear {
  /** Lower garment. */
  bottom: AutoMovieHumanLowerUnderwear;

  /** Upper garment. */
  top: AutoMovieHumanUpperUnderwear;

  /** Garment colour as an sRGB hex `#RRGGBB`. */
  color: string & tags.Pattern<"^#[0-9A-Fa-f]{6}$">;
}
