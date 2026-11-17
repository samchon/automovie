import type { IAutoMovieHumanUnderwear } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanUnderwear. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanUnderwearSchema = IAutoMovieHumanUnderwear & {
  /** Garment colour as an sRGB hex `#RRGGBB`. */
  color: string & tags.Pattern<"^#[0-9A-Fa-f]{6}$">;
};
