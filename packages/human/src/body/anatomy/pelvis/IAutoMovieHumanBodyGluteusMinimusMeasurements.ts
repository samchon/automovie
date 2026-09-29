import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed volume of one gluteus minimus, deep to medius.
 *
 * Its iliac origin and anterior greater-trochanter insertion are distinct
 * from medius. The volume is an internal tissue scalar, not an exterior
 * skin control; overlap or a copied medius volume would double-count tissue.
 * The generator must establish its own surface and attachments separately.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyGluteusMinimusMeasurements {
  /** Deep minimus belly, excluding medius and subcutaneous adipose. */
  readonly muscleBellyVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
