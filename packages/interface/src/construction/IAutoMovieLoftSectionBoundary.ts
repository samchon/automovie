import type { IAutoMovieLoftSectionBoundaryControls } from "./IAutoMovieLoftSectionBoundaryControls";
import type { IAutoMovieLoftViewRead } from "./IAutoMovieLoftViewRead";

/**
 * Data and callback contracts shared by the LoftSectionBoundary operations.
 *
 * @evidence contracts/development/design.md#principled-representation A native bridge holds both physical-mm endpoints with exact scalar2 and their log/logit controls; the native discriminator separates it from other field families.
 * @evidence contracts/development/design.md#minimal-and-owned-surface LoftSectionBoundary shares endpoint source jets with LoftViewRead and the dedicated transformed-control record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Positive native scalar admission and matching endpoint controls are runtime checks; the record cannot promise arbitrary G1 chain compatibility.
 * @evidence contracts/development/common.md#meaningful-documentation States exact endpoint ownership and transformed physical derivative units.
 */
export namespace IAutoMovieLoftSectionBoundary {
  /**
   * Actual native-family scalar2 at one regular boundary.
   *
   * @evidence contracts/development/design.md#principled-representation The eight effective scalar2 tuples describe the same native family and physical station used by the boundary.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One station and the shared native input record preserve endpoint ownership.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A composed non-native endpoint cannot acquire this type by fitting; actual physical jets must be available.
   * @evidence contracts/development/common.md#meaningful-documentation Inputs include cap effects once and station uses mm.
   */
  export interface IEnd {
    /** Location in the receiving chain's physical station, mm. */
    station: number;

    /** Exact original effective endpoint2, retained without a log/exp round trip. */
    inputs: IAutoMovieLoftViewRead.IJets;
  }

  /**
   * One explicit positive native scalar generating field.
   *
   * @evidence contracts/development/design.md#principled-representation Original endpoints and transformed Hermite rows determine the field independently of registration history.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A discriminator, two endpoints and two complete transformed rows suffice.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Does not claim monotonicity, proximity to the replaced child span or binary64 positivity without read-time admission.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes exact endpoint tuples from the declared interior log/logit interpolation.
   */
  export interface IBridge {
    /** Distinguishes this native-family law from any mixed generating field. */
    kind: "native";

    /** Exact lower and upper effective scalar2 boundary data. */
    ends: readonly [
      IAutoMovieLoftSectionBoundary.IEnd,
      IAutoMovieLoftSectionBoundary.IEnd,
    ];

    /** Corresponding log/logit rows with physical, rather than normalized, derivatives. */
    controls: readonly [
      IAutoMovieLoftSectionBoundaryControls,
      IAutoMovieLoftSectionBoundaryControls,
    ];
  }
}
