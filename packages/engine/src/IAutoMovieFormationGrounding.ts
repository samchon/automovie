import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
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
