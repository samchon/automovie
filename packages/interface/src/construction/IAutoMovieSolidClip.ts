/** Data and callback contracts shared by the SolidClip operations. */
export namespace IAutoMovieSolidClip {
  /**
   * A mesh vertex with its host-rail parameter and one or two incident face
   * charts.
   */
  export interface IRailPoint {
    /** Its vertex in the body's mesh. */
    vertex: number;

    /**
     * Its phase on the blend chain, increasing along the rail from 0 to under a
     * turn.
     */
    phase: number;

    /** The body faces it lies on: one, or the two a crossing joins. */
    faces: number[];

    /** Its chart point on each of those faces. */
    chart: Map<number, [number, number]>;

    /**
     * The rail's offset direction there in the chart of its one face, of unit
     * world speed; absent at a crossing.
     */
    across?: [number, number];
  }
}
