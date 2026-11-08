import type { IAutoMovieRecoveryOptions } from "./IAutoMovieRecoveryOptions";

/**
 * Observation options for the default Bernstein-control result.
 * Omitting the selector and explicitly choosing Bezier have the same basis.
 *
 * @evidence contracts/development/design.md#principled-representation An omitted or Bezier-only selector matches the observation operation's existing Bernstein default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This named contract distinguishes omission from a generic explicitly selected basis without adding runtime state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration neither converts coefficients nor supplies a hidden selector.
 * @evidence contracts/development/common.md#meaningful-documentation States the saved basis and the meaning of selector omission.
 */
export interface IAutoMovieRecoveryDefaultObservationOptions extends IAutoMovieRecoveryOptions {
  /** Saved Bernstein controls; omission selects the same Bezier basis. */
  curveFormat?: "bezier";
}
