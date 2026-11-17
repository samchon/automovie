/**
 * A band between original parent/child ports through their actual neighboring fields.
 *
 * Its original map inputs follow the port clock then parent-to-child transverse.
 * The engine surface chart is (transverse, original clock), consistent with the
 * existing kernel's second-coordinate period. Both fields and C2 chart
 * maps must own that rectangle before realization. Names refer to invocation
 * context, not a later contact search or boundary Taylor extrapolation.
 *
 * @evidence contracts/development/design.md#principled-representation Pull back both actual C2 neighboring fields and combine them with a transverse weight flat through order two at both rails, preserving their complete boundary total2. A side records the original field, whole chart map and rail's boundary/material/binding identities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two closed source/map/boundary addresses, an original clock interval and an outward sign specify the existing fields' band without callbacks in the AST. Known-port preparation resolves both sides in the invocation's original source context.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A port is not an end continuation or a proof of topology. No generated-loft intersection, collected-jet Taylor field or sampled refit supplies the neighboring maps. Global regularity/self-intersection admission remains separate from the declared C2 boundary law. Strings retain explicit ownership and do not certify topology or replace missing field callbacks.
 * @evidence contracts/development/common.md#meaningful-documentation Defines both band coordinates, complete original-neighborhood premises, explicit material/binding identity and the limits of this declaration. Original source identities for each side of a prepared known-port band. Member documentation specifies their units, references and absence behavior.
 */
export interface IAutoMovieConstructionKnownPort {
  /** Stable band identity, separate from the logical regions it connects. */
  name: string;

  /** Actual original tangential-clock interval; units belong to its original owner. */
  domain: [number, number];

  /** Parent's original field, chart map and sewn rail owner. */
  parent: IAutoMovieConstructionKnownPort.ISide;

  /** Child's original field, chart map and sewn rail owner. */
  child: IAutoMovieConstructionKnownPort.ISide;

  /** Sign taking original tangential-cross-transverse derivatives outward; the engine transposes its surface chart and negates this sign. */
  orientation: 1 | -1;

  /** Optional complete original clock period; end must equal start+period in binary64. Absence keeps an open tangential domain, which cannot be consumed by a closed mesh seam. */
  period?: number;
}

/**
 * Original source identities for each side of a prepared known-port band.
 *
 */
export namespace IAutoMovieConstructionKnownPort {
  /**
   * One original field neighborhood, its chart map and its owned rail.
   *
   * AutoMovieConstructionKnownPort resolves field and map in the invocation source. The map must cover the complete band rectangle with the original C2 field; boundary identifies the rail whose material and binding owners must agree. These strings are references, not serialized callback implementations or evidence that two charts are geometrically continuous.
   *
   * @evidence contracts/development/design.md#principled-representation Explicit source/map and boundary/material/binding identities preserve the original neighborhood and its sewn ownership.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Known-port preparation resolves this side into the existing source callbacks and retains the declared rail identity.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No Taylor extension, later contact search or sampled refit substitutes for the cited original field and complete map.
   * @evidence contracts/development/common.md#meaningful-documentation Explains what each identity addresses and which neighborhood and boundary obligations remain for preparation.
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
