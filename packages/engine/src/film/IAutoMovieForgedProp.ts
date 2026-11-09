import {
  IAutoMovieConstraintViolation,
  IAutoMoviePropSpec,
} from "@automovie/interface";

/**
 * What `forgeProp` returns: the spec gated on its model and articulation
 * contracts, ready for staging to place and, when articulated, for
 * `resolveFrame` to constrain and drive through `bindProfile`; or every
 * violation the spec carried.
 *
 * @evidence contracts/development/design.md#principled-representation A discriminated union on the literal `success`; `forgeProp` runs the model, imported-appearance and articulation gates to completion before choosing a branch, so the failure branch carries the whole list.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The success-or-violations shape every engine stage gate returns, so `validatePropPlacements`, `gateAuthoredObjectMotions` and `AutoMovieProject` branch on it the same way.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No partial acceptance exists: a spec with any violation is not echoed, so a caller cannot stage a prop whose articulation would make `bindProfile` throw.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, which contracts are gated, and what each downstream stage does with an accepted spec.
 */
export type IAutoMovieForgedProp =
  | IAutoMovieForgedProp.ISuccess
  | IAutoMovieForgedProp.IFailure;

export namespace IAutoMovieForgedProp {
  /**
   * The prop passed the model contract (id equals node, origin and imported
   * closure coherent, no skeleton, `validateModel` clean) and, when present,
   * the articulation contract.
   *
   * @evidence contracts/development/design.md#principled-representation Echoes the input spec as accepted, because every check is a predicate over the spec and the forge derives no new data from it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One field, the accepted spec, since staging joins the prop by its `node` and needs nothing the spec does not already carry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The spec is returned untouched: no missing mesh binding, origin or profile mapping is filled in to make it pass.
   * @evidence contracts/development/common.md#meaningful-documentation States every contract the branch certifies and that `prop` is the caller's own spec object.
   */
  export interface ISuccess {
    /** Discriminator. */
    success: true;

    /** The accepted spec, the same object the caller passed, for the staging join. */
    prop: IAutoMoviePropSpec;
  }

  /**
   * The spec broke a contract; every violation is listed for the correction
   * round and no prop was accepted.
   *
   * @evidence contracts/development/design.md#principled-representation Reports every unmapped profile key and every broken joint, mesh or digest at once, where `bindProfile` would throw on the first, and remaps `validateModel` paths from `$input` to `$input.model`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The list is the only payload because a refused prop has nothing to stage.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A malformed LOD digest is reported once rather than also as a ledger mismatch, a deliberate rule stated where it is applied, and no violation is suppressed by prop kind.
   * @evidence contracts/development/common.md#meaningful-documentation States that no prop is accepted on this branch and that the list is complete for one correction round.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, with paths into the spec (`$input...`). */
    violations: IAutoMovieConstraintViolation[];
  }
}
