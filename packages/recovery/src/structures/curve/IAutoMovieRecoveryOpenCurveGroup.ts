/**
 * Unsupported open-curve component across two adjacent saved sections.
 *
 * @evidence contracts/common.md#principled-implementation Lists retain every involved local curve ordinal and the unresolved incidence cause.
 * @evidence contracts/common.md#clear-and-simple-design An explicit group keeps unsupported observations separate from admitted one-to-one pairs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, normal array, positional weld or inferred closure is supplied.
 * @evidence contracts/common.md#meaningful-documentation Fields distinguish section and curve ordinals, retained orientation and physical sampling policy.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural record performs no observation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and arrays.
 */
export interface IAutoMovieRecoveryOpenCurveGroup {
  /** Involved open-curve ordinals in the preceding section; may be empty. */
  before: number[];

  /** Involved open-curve ordinals in the following section; may be empty. */
  after: number[];

  /** Why no supported ordinary correspondence was published. */
  reason: string;
}
