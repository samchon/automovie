import type { IAutoMovieRecoveryOptions } from "../../index";

/**
 * Observation options for the default Bernstein-control result. Omitting the
 * selector and explicitly choosing Bezier have the same basis.
 */
export interface IAutoMovieRecoveryDefaultObservationOptions extends IAutoMovieRecoveryOptions {
  /** Saved Bernstein controls; omission selects the same Bezier basis. */
  curveFormat?: "bezier";
}
