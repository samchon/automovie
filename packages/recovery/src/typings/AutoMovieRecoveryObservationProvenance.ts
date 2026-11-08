import type { IAutoMovieRecoveryObservedInteriorPoint } from "../structures/observation/IAutoMovieRecoveryObservedInteriorPoint";
import type { IAutoMovieRecoveryObservedPoint } from "../structures/observation/IAutoMovieRecoveryObservedPoint";

/**
 * Closed point-origin choices for a transported geometric observation chart.
 *
 * @evidence contracts/development/design.md#principled-representation Distinct kind literals preserve observed-point identity versus strict PL-edge interpolation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two named records define the complete existing provenance union.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No unqualified material correspondence or invented observation arm is admitted.
 * @evidence contracts/development/common.md#meaningful-documentation Names both origins and leaves their addresses and fractions with the corresponding record.
 */
export type AutoMovieRecoveryObservationProvenance =
  | IAutoMovieRecoveryObservedPoint
  | IAutoMovieRecoveryObservedInteriorPoint;
