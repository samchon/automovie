/**
 * Ordered model-space construction line generated from the same coefficients as skin.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the producer's original identities, units and range semantics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A shared named interface replaces the anonymous nested record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This type infers no observations and supplies no generated geometry.
 * @evidence contracts/development/common.md#meaningful-documentation Members state address, range or model-space position meaning.
 */
export interface IAutoMovieRecoveryConstructionLine {
  /** Stable identity within this saved publication. */
  id: string;

  /** Declared closure topology of the generating course. */
  closed: boolean;

  /** Ordered generated construction positions, metres. */
  points: [number, number, number][];
}
