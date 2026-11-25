/** Data and callback contracts shared by the SolidMeshIncidence operations. */
export namespace IAutoMovieSolidMeshIncidence {
  /** One directed left boundary component in the native parameter cover. */
  export interface IWalk {
    /** Original vertex IDs, without repeating the closing vertex. */
    vertices: number[];

    /** Period integers added at each vertex; the first is zero. */
    lifts: number[];

    /** Total period change on returning to the first vertex ID. */
    winding: number;
  }
}
