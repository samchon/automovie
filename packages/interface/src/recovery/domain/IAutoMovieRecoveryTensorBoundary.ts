/**
 * Named tensor endpoint curve with its exact recipe control identities and native phase intervals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Saved coefficient curve identity. Ordered recipe control-ID rows; IDs retain their declared coefficient ownership.
 * @evidence contracts/development/design.md#principled-representation Named tensor endpoint curve with its exact recipe control identities and native phase intervals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryTensorFamily share IAutoMovieRecoveryTensorBoundary's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryTensorBoundary {
  /** Saved coefficient curve identity. */
  curveName: string;

  /** Ordered recipe control-ID rows; IDs retain their declared coefficient ownership. */
  controlIds: readonly (readonly number[])[];

  /** Saved phase interval boundaries used by those recipe controls. */
  phaseIntervals: readonly number[];
}
