import type { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

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
 * `anchor.y` keeps its staged meaning. `formationGroundRelief` looks up the
 * anchor's ground height directly at each call and keeps nothing between calls,
 * so a record may change its `anchor` or `ground` between placements.
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
