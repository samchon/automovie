import type { IAutoMovieHumanPigmentation } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Constitutive skin pigmentation and one iris color shared by both eyes. Use
 * this type to generate a typia validator or schema for melanin, eumelanin
 * share and haemoglobin volume fractions.
 */
export type IAutoMovieHumanPigmentationSchema = IAutoMovieHumanPigmentation & {
  /**
   * Epidermal melanin volume fraction, dimensionless. Measured melanosome fractions are 0.013 to 0.063 in lightly, 0.11 to 0.16 in moderately and 0.18 to 0.43 in darkly pigmented adults (Jacques 1998, "Skin Optics", Oregon Medical Laser Center News).
   */
  melanin: number & tags.Minimum<0> & tags.Maximum<0.5>;

  /**
   * Share of eumelanin in the epidermal melanin, the rest being pheomelanin, dimensionless. Donner and Jensen illustrate 0.7.
   */
  eumelaninShare: number & tags.Minimum<0> & tags.Maximum<1>;

  /**
   * Dermal haemoglobin volume fraction, dimensionless; the model range of Donner and Jensen is about 0.001 to 0.1 and site maxima reach about 0.3.
   */
  haemoglobin: number & tags.Minimum<0.001> & tags.Maximum<0.32>;
};
