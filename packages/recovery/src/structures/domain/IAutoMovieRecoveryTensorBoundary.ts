/**
 * Named tensor endpoint curve with its exact recipe control identities and native phase intervals.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 */
export interface IAutoMovieRecoveryTensorBoundary {
  /** Saved coefficient curve identity. */
  curveName: string;

  /** Ordered recipe control-ID rows; IDs retain their declared coefficient ownership. */
  controlIds: readonly (readonly number[])[];

  /** Saved phase interval boundaries used by those recipe controls. */
  phaseIntervals: readonly number[];
}
