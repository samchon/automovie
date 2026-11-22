/**
 * The existing periodic cubic's value reader and a local outward range.
 * Preparation and reading retain the original 64 Jacobi sweeps and literal
 * expression. Range conversion encloses that computed reader, not an exact
 * solution of the infinite-precision cyclic equations or tight extrema.
 *
 * @evidence contracts/development/design.md#principled-representation Owns a periodic scalar preparation with radian phase and control-unit values; IPrepared pairs its unchanged value reader with optional finite outward range admission. Finite controls and proof arithmetic remain runtime premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface NaturalSpline.periodic and native rail-range consumers share this one create/IPrepared owner. Only current at and range capabilities are public; interval conversion stays private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sampled replacement, solver choice, geometric domain or consumer-specific case enters the public representation. Unavailable range proof throws explicitly while value reading retains its existing premises.
 * @evidence contracts/development/common.md#meaningful-documentation States the common preparation, phase/control units, exact-reader versus conservative-range scope and finite-proof limitation; the member declarations give input lifetime and failure ownership.
 */
export namespace IAutoMoviePeriodicCubic {
  /**
   * One preparation shared by value reads and optional range admission.
   *
   * @evidence contracts/development/design.md#principled-representation A periodic scalar reader retains its borrowed controls and actual computed curvatures; its range encloses finite-phase values in those same units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface NaturalSpline reads at, while native root admission reads range and at from one preparation. No coefficients, solver options or geometric interpretation are exposed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Value reading keeps its existing caller premises; only the optional proof capability refuses unavailable finite arithmetic. No sampled range or replacement curve is represented.
   * @evidence contracts/development/common.md#meaningful-documentation States the shared preparation, borrowed immutable controls, phase units and the distinct range failure contract.
   */
  export interface IPrepared {
    /**
     * Existing periodic value at a phase in radians; controls remain unchanged.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the phase unit, the value's control units and that the controls are not changed.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared member slot; `create` is its implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared member slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared member slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member slot has no body; `create` states the reader's cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member slot retains nothing; `create` states the closure's retention.
     */
    at(psi: number): number;

    /**
     * Finite outward bounds for every finite phase; throws when arithmetic cannot certify them.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what the bounds enclose, their units as the controls' and the thrown failure.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A declared member slot; `create` is its implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A declared member slot has no body.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declared member slot has no body.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member slot has no body; `create` states the conversion's cost.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member slot coordinates no work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member slot retains nothing; `create` states the closure's retention.
     */
    range(): readonly [number, number];
  }
}
