/**
 * Band joining actual parent and child field neighborhoods through their
 * original port clocks. Each side's map receives original clock followed by
 * normalized parent-to-child transverse coordinate. The kernel's prepared
 * surface publishes those axes in the opposite order.
 */
export interface IAutoMovieConstructionKnownPort {
  /** Stable name of the band published by its prepared surface. */
  name: string;

  /** Increasing tangential interval in the original port clock's units. */
  domain: [number, number];

  /** Original parent field, map and rail references for transverse zero. */
  parent: IAutoMovieConstructionKnownPort.ISide;

  /** Original child field, map and rail references for transverse one. */
  child: IAutoMovieConstructionKnownPort.ISide;

  /**
   * Outward sign of tangential derivative cross transverse derivative in the
   * authored order. The prepared kernel chart uses the negated sign after
   * transposition.
   */
  orientation: 1 | -1;

  /**
   * Optional original clock period. Set the upper bound to the lower bound plus
   * one period. Omission leaves an open clock interval.
   */
  period?: number;
}

/** Original source identities for each side of a prepared known-port band. */
export namespace IAutoMovieConstructionKnownPort {
  /**
   * Original neighboring field, complete chart map and rail, material and
   * binding keys. Keep these addresses consistent with the actual sewn
   * boundary.
   */
  export interface ISide {
    /** Key of the live neighboring field in the invocation's field map. */
    field: string;

    /** Key of the live C2 correspondence for the entire band rectangle. */
    map: string;

    /** Identity of the rail owned by this original side. */
    boundary: string;

    /**
     * Material coordinate owner reference for the original side and its sewn
     * rail.
     */
    material: string;

    /** Binding field owner reference for the original side and its sewn rail. */
    binding: string;
  }
}
