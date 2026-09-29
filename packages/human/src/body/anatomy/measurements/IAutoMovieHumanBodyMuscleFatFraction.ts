import type { AutoMovieHumanBodyAcquisitionPosture } from "./AutoMovieHumanBodyAcquisitionPosture";

/**
 * Whole-belly MRI proton-density fat fraction or a desired fraction.
 *
 * Multi-echo Dixon MRI estimates the fat-proton signal fraction within a
 * muscle. This is not subcutaneous adipose volume, muscle force, or a claim
 * that the fat is uniformly distributed. Published thigh MRI repeatability
 * compares this quantity with spectroscopy (Grimm et al. 2018,
 * doi:10.1002/jcsm.12343).
 * Runtime admission enforces a finite fraction in [0, 1].
 * @author Samchon
 */
export type IAutoMovieHumanBodyMuscleFatFraction =
  | { readonly kind: "target"; readonly fraction: number }
  | {
      readonly kind: "observed";
      readonly fraction: number;
      readonly modality: "mri-dixon";
      readonly acquisitionPosture: AutoMovieHumanBodyAcquisitionPosture;
      /** Absolute fraction uncertainty; unknown when omitted. */
      readonly uncertaintyFraction?: number;
    };
