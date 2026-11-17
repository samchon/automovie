

/** Data and callback contracts shared by the SolidClip operations. */
export namespace IAutoMovieSolidClip {
  /**
     * A mesh vertex with its host-rail parameter and one or two incident face charts.
     *
     * @evidence contracts/development/design.md#principled-representation Regular points belong to one face; a placed crossing shares one vertex between two chart readings so clipped face boundaries can refer to the same index.
     * @evidence contracts/development/design.md#minimal-and-owned-surface One record couples the shared mesh index to per-face chart data and the optional side-probe direction.
     * @evidence contracts/development/design.md#prohibited-design-shortcuts Two chart readings alone do not certify identical world positions; the crossing builder's finite bisection and atlas premises own that approximation.
     * @evidence contracts/development/common.md#meaningful-documentation Gives phase order, face-chart mapping and the absence of an across probe at crossings.
     */
    export interface IRailPoint {
      /** Its vertex in the body's mesh. */
      vertex: number;
  
      /** Its phase on the blend chain, increasing along the rail from 0 to under a turn. */
      phase: number;
  
      /** The body faces it lies on: one, or the two a crossing joins. */
      faces: number[];
  
      /** Its chart point on each of those faces. */
      chart: Map<number, [number, number]>;
  
      /** The rail's offset direction there in the chart of its one face, of unit world speed; absent at a crossing. */
      across?: [number, number];
    }
}
