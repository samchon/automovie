import { IAutoMovieFormationDesign } from "@automovie/interface";

import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";

/**
 *
 * What a formation needs to say where one of its slots stands.
 *
 * The six design fields slot placement reads (`id` for the range error, `count`
 * for the slot range, `layout`, `anchor`, `facingDeg`, and `seed` for scatter
 * and dressing) plus the terrain snapshot. Hero overrides and model recipes are
 * left out, so a gate or a measurement can place members from a compiled
 * formation without the full design record.
 *
 * @evidence contracts/common.md#principled-implementation A `Pick` of `IAutoMovieFormationDesign` intersected with `IAutoMovieFormationGrounding`, so the alias tracks the design's own field types and any change to them reaches every placement consumer at compile time.
 * @evidence contracts/common.md#clear-and-simple-design Names exactly what `formationSlotPosition` reads, letting the ground gate, the overlap gate and the compiled formation share one placement shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds and widens no field; `id` is carried only so the slot-range `RangeError` can name the formation.
 * @evidence contracts/common.md#meaningful-documentation States which design fields are kept, what each serves during placement, and what is deliberately left out.
 * @evidence contracts/performance.md#cost-and-resources A type alias erased at compile time; it performs no work. Passing one placement object for every slot of a unit lets `formationGroundRelief` reuse the anchor's ground height across members, because that cache is keyed by object identity rather than by field values. Erased at compile time; the record it types is owned by the compiled formation or the design that holds it.
 * @author Samchon
 */
export type IAutoMovieFormationPlacement = Pick<
  IAutoMovieFormationDesign,
  "id" | "count" | "layout" | "anchor" | "facingDeg" | "seed"
> &
  IAutoMovieFormationGrounding;
