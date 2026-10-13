import { IAutoMovieFormationDesign } from "@automovie/interface";

import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";

/**
 * What a formation needs to say where one of its slots stands.
 *
 * The six design fields slot placement reads (`id` for the range error, `count`
 * for the slot range, `layout`, `anchor`, `facingDeg`, and `seed` for scatter
 * and dressing) plus the terrain snapshot. Hero overrides and model recipes are
 * left out, so a gate or a measurement can place members from a compiled
 * formation without the full design record.
 *
 * @author Samchon
 */
export type IAutoMovieFormationPlacement = Pick<
  IAutoMovieFormationDesign,
  "id" | "count" | "layout" | "anchor" | "facingDeg" | "seed"
> &
  IAutoMovieFormationGrounding;
