import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed volume of one gluteus medius, deep to maximus.
 *
 * The ilium and facets of the femoral greater trochanter define its origin
 * and insertion. Its separate CT/MRI volume must not be counted again as
 * maximus or as subcutaneous adipose tissue. An observed volume alone leaves
 * the tendon footprint and standing muscle surface unresolved.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGluteusMediusMeasurements {
  /** One side's medius belly rather than overlying maximus or adipose. */
  readonly muscleBellyVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
