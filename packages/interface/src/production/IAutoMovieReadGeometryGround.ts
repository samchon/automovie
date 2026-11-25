/** World-ground query result used by direct geometry and formation measurements. */
export namespace IAutoMovieReadGeometryGround {
  /**
   * Fresh scalar result for the first authored world surface containing the
   * queried XZ point.
   *
   * The engine uses declared surface order, not the highest surface or the
   * nearest walkable one. A null world, empty surface list or point outside
   * every surface yields height 0, surface null and walkable false together.
   * Surface containment and height interpolation belong to worldGroundSurface
   * and worldSurfaceHeight; this record does not validate the world's geometry
   * or infer physical support. No world data is retained or cached.
   */
  export type IResult = {
    /**
     * World ground Y in metres from the first containing surface. Zero when no
     * surface contains the query, distinguished by surface:null and
     * walkable:false.
     */
    height: number;

    /**
     * ID of the first containing surface in world surface order; null when no
     * authored surface contains the query.
     */
    surface: string | null;

    /**
     * The selected surface's declared walkability. False for absent ground; a
     * zero height alone does not imply support.
     */
    walkable: boolean;
  };
}
