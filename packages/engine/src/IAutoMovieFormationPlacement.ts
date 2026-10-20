import { IAutoMovieFormationDesign } from "@automovie/interface";

import { IAutoMovieFormationGrounding } from "./IAutoMovieFormationGrounding";

/**
 * What a formation needs to say where one of its slots stands.
 *
 * The six design fields slot placement reads (`id` for the range error, `count`
 * for the slot range, `layout`, `anchor`, `facingDeg`, and `seed` for scatter
 * and dressing) plus the terrain snapshot. Hero overrides and model groups are
 * left out, so a gate or a measurement can place members from a compiled
 * formation without the full design record.
 *
 * @evidence contracts/common.md#principled-implementation A `Pick` of the six design fields slot placement reads intersected with the terrain record, so the compiler proves placement needs nothing else and a compiled formation satisfies it structurally.
 * @evidence contracts/common.md#clear-and-simple-design Derived from `IAutoMovieFormationDesign` rather than restated, so a change to any picked field's type reaches placement without a second declaration to update.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Leaves out hero overrides and model groups so a gate cannot depend on them, and no consumer adds a private field to it.
 * @evidence contracts/common.md#meaningful-documentation Names each picked field and what placement uses it for, the added terrain snapshot, and the omitted design members with the reason they are left out.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type alias; per-slot placement cost is constant per slot and is answered on `formationSlotPosition`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Has no behavior to share; placement caches keyed by such a record, like the ground gate's member list, are owned by their gates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A view onto a design or compiled formation record that the caller owns; using the alias copies nothing and holds nothing.
 */
export type IAutoMovieFormationPlacement = Pick<
  IAutoMovieFormationDesign,
  "id" | "count" | "layout" | "anchor" | "facingDeg" | "seed"
> &
  IAutoMovieFormationGrounding;
