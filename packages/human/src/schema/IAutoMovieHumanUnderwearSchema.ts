import type { IAutoMovieHumanUnderwear } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Upper and lower underwear choices with one shared sRGB hexadecimal color.
 * Use this type to generate a typia validator or schema for the garment
 * description.
 */
export type IAutoMovieHumanUnderwearSchema = IAutoMovieHumanUnderwear & {
  /** Garment colour as an sRGB hex `#RRGGBB`. */
  color: string & tags.Pattern<"^#[0-9A-Fa-f]{6}$">;
};
