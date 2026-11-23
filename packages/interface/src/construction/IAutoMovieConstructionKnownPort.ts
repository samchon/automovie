/**
 * A band between original parent/child ports through their actual neighboring
 * fields.
 *
 * Its original map inputs follow the port clock then parent-to-child
 * transverse. The engine surface chart is (transverse, original clock),
 * consistent with the existing kernel's second-coordinate period. Both fields
 * and C2 chart maps must own that rectangle before realization. Names refer to
 * invocation context, not a later contact search or boundary Taylor
 * extrapolation.
 */
export interface IAutoMovieConstructionKnownPort {
  /** Stable band identity, separate from the logical regions it connects. */
  name: string;

  /**
   * Actual original tangential-clock interval; units belong to its original
   * owner.
   */
  domain: [number, number];

  /** Parent's original field, chart map and sewn rail owner. */
  parent: IAutoMovieConstructionKnownPort.ISide;

  /** Child's original field, chart map and sewn rail owner. */
  child: IAutoMovieConstructionKnownPort.ISide;

  /**
   * Sign taking original tangential-cross-transverse derivatives outward; the
   * engine transposes its surface chart and negates this sign.
   */
  orientation: 1 | -1;

  /**
   * Optional complete original clock period; end must equal start+period in
   * binary64. Absence keeps an open tangential domain, which cannot be consumed
   * by a closed mesh seam.
   */
  period?: number;
}

/** Original source identities for each side of a prepared known-port band. */
export namespace IAutoMovieConstructionKnownPort {
  /**
   * One original field neighborhood, its chart map and its owned rail.
   *
   * AutoMovieConstructionKnownPort resolves field and map in the invocation
   * source. The map must cover the complete band rectangle with the original C2
   * field; boundary identifies the rail whose material and binding owners must
   * agree. These strings are references, not serialized callback
   * implementations or evidence that two charts are geometrically continuous.
   */
  export interface ISide {
    /** Key of the actual original neighboring field in the runtime context. */
    field: string;

    /** Key of its actual C2 chart map from the entire band rectangle. */
    map: string;

    /** Boundary identity also consumed by this original field's rail. */
    boundary: string;

    /** Actual material-coordinate owner, shared with that same sewn rail. */
    material: string;

    /** Actual binding-field owner, shared with that same sewn rail. */
    binding: string;
  }
}
