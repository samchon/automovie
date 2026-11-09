/**
 * Unsupported open-curve component across two adjacent saved sections.
 *
 * @evidence contracts/development/design.md#principled-representation Lists retain every involved local curve ordinal and the unresolved incidence cause.
 * @evidence contracts/development/design.md#minimal-and-owned-surface An explicit group keeps unsupported observations separate from admitted one-to-one pairs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source mesh, normal array, positional weld or inferred closure is supplied.
 * @evidence contracts/development/common.md#meaningful-documentation Fields distinguish section and curve ordinals, retained orientation and physical sampling policy.
 */
export interface IAutoMovieRecoveryOpenCurveGroup {
  /** Involved open-curve ordinals in the preceding section; may be empty. */
  before: number[];

  /** Involved open-curve ordinals in the following section; may be empty. */
  after: number[];

  /** Why no supported ordinary correspondence was published. */
  reason: string;
}
