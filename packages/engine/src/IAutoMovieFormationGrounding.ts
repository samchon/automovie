import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 * The terrain a formation's members are placed on.
 *
 * Carried on the record rather than passed beside it, because a member's height
 * is part of where that member stands: a consumer that could ask for a position
 * without the ground would be a consumer that places a crowd flat, which is the
 * defect this exists to remove. The compiled formation snapshots the world
 * surfaces whose ground plan reaches its footprint, so the builder, the gate,
 * the viewer and an offline measurement script all place from one record and
 * cannot answer differently.
 *
 * A member rises by the terrain under it minus the terrain under the anchor, so
 * `anchor.y` keeps its staged meaning. `formationGroundRelief` remembers the
 * anchor's ground height per record object in a `WeakMap`, so a record must not
 * have its `anchor` or `ground` changed after members have been placed from it.
 *
 * @evidence contracts/common.md#principled-implementation Height is relief, the ground height under a member minus the ground height under the anchor, so `anchor.y` keeps its staged meaning and level terrain yields zero relief; it relies on the record object not being mutated after placement because the anchor height is remembered per object.
 * @evidence contracts/common.md#clear-and-simple-design One optional member mixed into the placement and design records, so every placement path receives terrain through the same record instead of a separate parameter some callers could omit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No surface or formation is special-cased; absent terrain, a member off the terrain and an anchor off the terrain all give zero relief as authored facts, not as a fallback for a failed lookup.
 * @evidence contracts/common.md#meaningful-documentation States the relief rule, the snapshot's source, what an absent or empty list means, the zero-relief cases, and the immutability requirement that follows from the per-record cache.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record field only; the ground lookup per member is `worldGroundHeight` over the listed polygons inside `formationGroundRelief`, answered there.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares nothing itself; the anchor datum reuse keyed by this record object belongs to `formationGroundRelief`, which never invalidates an entry, hence the documented rule that a placed record keeps its anchor and ground.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References a read-only surface array owned by the compiled formation or the world design; the anchor-height cache entry keyed by it is weak and dies with the record.
 */
export interface IAutoMovieFormationGrounding {
  /**
   * World terrain under this formation, or absent when it stands on none.
   *
   * A snapshot of the production world's surfaces, kept beside the formation
   * the way a compiled instance set keeps the route it follows. Absent or empty
   * means no terrain was declared under the unit, and every member then stands
   * at the anchor's own height. A member over no surface, or an anchor over
   * none, also gets zero relief.
   */
  readonly ground?: readonly IAutoMovieWorldSurface[];
}
