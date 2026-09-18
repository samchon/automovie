/**
 * One source-level loss or approximation accepted by conversion.
 *
 * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-loss Requires every dropped, approximated, or precision-reduced source fact and consequence.
 * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-loss-ledger Types one entry in the external conversion loss ledger.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionLossEntry {
  /**
   * Closed loss or approximation discriminator.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-loss Distinguishes omission, approximation, precision reduction, and semantic loss.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-loss-ledger Classifies the unsupported or altered source feature.
   */
  kind:
    | "channel-dropped"
    | "channel-approximated"
    | "precision-loss"
    | "semantic-loss";
  /**
   * Stable source elements affected by the loss.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-loss Requires loss to be attributed element by element.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-loss-ledger Binds a loss entry to its affected source support set.
   */
  source: string[];
  /**
   * Observable downstream consequence of the loss.
   *
   * @evidence requirements/external-inputs/conversion-receipts-and-determinism.md#external-conversion-receipt-loss Requires every loss to state its behavioral or fidelity consequence.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-receipt-loss-ledger Prevents successful output from implying preserved behavior.
   */
  consequence: string;
  /**
   * Whether the user explicitly accepted this loss.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-compatibility-override Requires risky automatic corrections to remain reviewable, overridable, or rejectable.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-external-adoption-receipt Keeps user authorization distinct from the compatibility finding itself.
   */
  authorized: boolean;
}
