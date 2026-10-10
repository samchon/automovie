import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed gluteus minimus volume or MRI fat fraction, deep to medius.
 *
 * Its iliac origin and anterior greater-trochanter insertion are distinct
 * from medius. The volume is an internal tissue scalar, not an exterior
 * skin control; overlap or a copied medius volume would double-count tissue.
 * The generator must establish its own surface and attachments separately.
 *
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMinimusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
