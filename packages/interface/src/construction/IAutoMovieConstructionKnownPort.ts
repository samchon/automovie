/**
 * A band between original parent/child ports through their actual neighboring fields.
 *
 * Its original map inputs follow the port clock then parent-to-child transverse.
 * The engine surface chart is (transverse, original clock), consistent with the
 * existing kernel's second-coordinate period. Both fields and C2 chart
 * maps must own that rectangle before realization. Names refer to invocation
 * context, not a later contact search or boundary Taylor extrapolation.
 *
 * @evidence contracts/development/design.md#principled-representation Pull back both actual C2 neighboring fields and combine them with a transverse weight flat through order two at both rails, preserving their complete boundary total2.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two closed source/map/boundary addresses, an original clock interval and an outward sign specify the existing fields' band without callbacks in the AST.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A port is not an end continuation or a proof of topology. No generated-loft intersection, collected-jet Taylor field or sampled refit supplies the neighboring maps. Global regularity/self-intersection admission remains separate from the declared C2 boundary law.
 * @evidence contracts/development/common.md#meaningful-documentation Defines both band coordinates, complete original-neighborhood premises, explicit material/binding identity and the limits of this declaration.
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

export namespace IAutoMovieConstructionKnownPort {
  /**
   * One owned source neighborhood and its preauthored rail identity.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: One owned source neighborhood and its preauthored rail identity.
   * @evidence contracts/development/design.md#principled-representation Represents One owned source neighborhood and its preauthored rail identity: interface of 5 members (`field`, `map`, `boundary`, `material`, `binding`). It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `ISide` in packages/interface/src/construction/IAutoMovieConstructionKnownPort.ts; its surface is the 5 members listed and the text shows 19 other files naming it, mostly packages/human (11), packages/engine (4), test (4), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
