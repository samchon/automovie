import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";

/**
 * What a formation needs to say where one of its slots stands.
 *
 * The six design fields slot placement reads (`id` for the range error, `count`
 * for the slot range, `layout`, `anchor`, `facingDeg`, and `seed` for scatter
 * and dressing), the optional `blocks` that lay the slots in blocks instead of
 * the one layout, plus the terrain snapshot. Hero overrides and model groups
 * are left out, so a gate or a measurement can place members from a compiled
 * formation without the full design record.
 */
export type IAutoMovieFormationPlacement = Pick<
  IAutoMovieFormationDesign,
  "id" | "count" | "layout" | "anchor" | "facingDeg" | "seed" | "blocks"
> &
  IAutoMovieFormationGrounding;
