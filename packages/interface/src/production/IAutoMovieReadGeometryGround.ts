/** World-ground query result used by direct geometry and formation measurements. */
export namespace IAutoMovieReadGeometryGround {
  /**
   * Fresh scalar result for the first authored world surface containing the queried XZ point.
   *
   * The engine uses declared surface order, not the highest surface or the nearest walkable one. A null world, empty surface list or point outside every surface yields height 0, surface null and walkable false together. Surface containment and height interpolation belong to worldGroundSurface and worldSurfaceHeight; this record does not validate the world's geometry or infer physical support. No world data is retained or cached.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States metre height, first-surface precedence, no-ground sentinel, declared walkability and fresh ownership.
   * @evidence contracts/development/design.md#principled-representation A nullable surface ID distinguishes absent ground from authored zero-height ground. The producer keeps the three fields coherent; the structural object type alone permits inconsistent combinations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Ground and formation queries need height, provenance ID and declared walkability without retaining an entire terrain record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Zero height with null surface is not a synthetic supporting plane; walkability is read from the selected surface even when a later surface would be walkable.
   */
  export type IResult = {
    /** World ground Y in metres from the first containing surface. Zero when no surface contains the query, distinguished by surface:null and walkable:false. */
    height: number;

    /** ID of the first containing surface in world surface order; null when no authored surface contains the query. */
    surface: string | null;

    /** The selected surface's declared walkability. False for absent ground; a zero height alone does not imply support. */
    walkable: boolean;
  };
}
