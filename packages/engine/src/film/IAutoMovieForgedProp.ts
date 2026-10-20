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
 * @evidence contracts/common.md#principled-implementation A discriminated union on the literal `success`; `forgeProp` runs the model, imported-appearance and articulation gates to completion before choosing a branch, so the failure branch carries the whole list.
 * @evidence contracts/common.md#clear-and-simple-design The success-or-violations shape every engine stage gate returns, so `validatePropPlacements`, `gateAuthoredObjectMotions` and `AutoMovieProject` branch on it the same way.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No partial acceptance exists: a spec with any violation is not echoed, so a caller cannot stage a prop whose articulation would make `bindProfile` throw.
 * @evidence contracts/common.md#meaningful-documentation States the producer, which contracts are gated, and what each downstream stage does with an accepted spec.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A type with no runtime body; the gates are answered on `forgeProp`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds a fresh result; `gateAuthoredObjectMotions` re-forges each registry spec per shot and caches nothing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union adds no storage of its own; the success branch aliases the caller's spec and the failure branch owns a violation list, as each member states.
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
   * @evidence contracts/common.md#principled-implementation Echoes the input spec as accepted, because every check is a predicate over the spec and the forge derives no new data from it.
   * @evidence contracts/common.md#clear-and-simple-design One field, the accepted spec, since staging joins the prop by its `node` and needs nothing the spec does not already carry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The spec is returned untouched: no missing mesh binding, origin or profile mapping is filled in to make it pass.
   * @evidence contracts/common.md#meaningful-documentation States every contract the branch certifies and that `prop` is the caller's own spec object.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A wrapper holding one reference to the accepted spec; `forgeProp` allocates it in constant time after its gates ran.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh wrapper per call around the caller's spec; nothing is cached.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains the caller's spec by reference and nothing else.
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
   * @evidence contracts/common.md#principled-implementation Reports every unmapped profile key and every broken joint, mesh or digest at once, where `bindProfile` would throw on the first, and remaps `validateModel` paths from `$input` to `$input.model`.
   * @evidence contracts/common.md#clear-and-simple-design The list is the only payload because a refused prop has nothing to stage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed LOD digest is reported once rather than also as a ledger mismatch, a deliberate rule stated where it is applied, and no violation is suppressed by prop kind.
   * @evidence contracts/common.md#meaningful-documentation States that no prop is accepted on this branch and that the list is complete for one correction round.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A record; violations are pushed during the producer's checks.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work `validatePropPlacements`, `gateAuthoredObjectMotions` and `AutoMovieProject` each forge the spec again and read only `success` or the list; no violation list is cached between them.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns the violation array, bounded by the spec's parts, joints, sealed assets, LOD levels and profile keys.
   */
  export interface IFailure {
    /** Discriminator. */
    success: false;

    /** Every violation found, with paths into the spec (`$input...`). */
    violations: IAutoMovieConstraintViolation[];
  }
}
