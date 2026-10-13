import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 *
 * The terrain a formation's members are placed on.
 *
 * Carried on the record rather than passed beside it, because a member's height
 * is part of where that member stands: a consumer that could ask for a position
 * without the ground would be a consumer that places a crowd flat, which is the
 * defect this exists to remove. The compiled formation snapshots exactly these
 * surfaces, so the builder, the gate, the viewer and an offline measurement
 * script all place from one record and cannot answer differently.
 *
 * A member rises by the terrain under it minus the terrain under the anchor, so
 * `anchor.y` keeps its staged meaning. `formationGroundRelief` remembers the
 * anchor's ground height per record object in a `WeakMap`, so a record must not
 * have its `anchor` or `ground` changed after members have been placed from it.
 *
 * @evidence contracts/common.md#principled-implementation Carries the surfaces on the record so `formationGroundRelief` can place every member by the terrain relief under it relative to the anchor's terrain, both read through `worldGroundHeight`.
 * @evidence contracts/common.md#clear-and-simple-design A one-field mixin intersected into `IAutoMovieFormationPlacement` and the formation designs the builder, gate and viewer place from, so ground travels with every placement request instead of as a separate argument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent or empty ground means zero relief by contract, reproducing pre-terrain placement; the per-record datum cache assumes the record is not mutated after its first query, and nothing enforces that.
 * @evidence contracts/common.md#meaningful-documentation States the snapshot ownership, the absent and empty meaning, the anchor-relative datum, the zero-relief cases, and the no-mutation premise of the datum cache.
 * @evidence contracts/performance.md#cost-and-resources Declares data only; the per-member ground lookup belongs to `formationGroundRelief`, which finds the anchor datum once per record. Its object identity keys the `WeakMap` of anchor ground heights in `formationGroundRelief`, so every member placed from one record shares one datum lookup, while a fresh object per slot would repeat it. The surface array is a snapshot held by the compiled formation for its lifetime, and the datum entry keyed by the record is weak, released once the record becomes unreachable.
 * @author Samchon
 */
export interface IAutoMovieFormationGrounding {
  /**
   * World terrain under this formation, or absent when it stands on none.
   *
   * A snapshot of the production world's surfaces, kept beside the formation
   * the way a compiled instance set keeps the route it follows. Absent or empty
   * means no terrain was declared under the unit, and every member then stands
   * at the anchor's own height, which is what a formation did before ground was
   * sampled at all. A member over no surface, or an anchor over none, also gets
   * zero relief.
   */
  readonly ground?: readonly IAutoMovieWorldSurface[];
}
