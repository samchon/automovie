import type { AutoMovieHumanIrisColor } from "../AutoMovieHumanIrisColor";

/**
 * Constitutive skin pigmentation and iris colour.
 *
 * Skin colour is the layered absorption of melanin in the epidermis and haemoglobin in the dermis, parameterised as volume fractions after the spectral skin model of Donner and Jensen (2006, Eurographics Symposium on Rendering, pp. 409-417). Regional variation such as lips, palms and soles is the skin material's work, not a parameter.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Constitutive skin pigmentation and iris colour.
 * @evidence contracts/development/design.md#principled-representation `melanin`: Epidermal melanin volume fraction, dimensionless. `eumelaninShare`: Share of eumelanin in the epidermal melanin, the rest being pheomelanin, dimensionless. `haemoglobin`: Dermal haemoglobin volume fraction, dimensionless; the model range of Donner and Jensen is about 0.001 to 0.1 and site maxima reach about 0.3.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanPigmentation is the canonical exchange used by IAutoMovieHumanPigmentationSchema, IAutoMovieHumanIdentity, IAutoMovieHumanParameters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `melanin`, `eumelaninShare`, `haemoglobin`, `iris`; callers supply the complete record.
 */
export interface IAutoMovieHumanPigmentation {
  /**
   * Epidermal melanin volume fraction, dimensionless. Measured melanosome fractions are 0.013 to 0.063 in lightly, 0.11 to 0.16 in moderately and 0.18 to 0.43 in darkly pigmented adults (Jacques 1998, "Skin Optics", Oregon Medical Laser Center News). Schema constraints: Minimum: 0; Maximum: 0.5; retained by Human's schema refinement. */
  melanin: number;

  /**
   * Share of eumelanin in the epidermal melanin, the rest being pheomelanin, dimensionless. Donner and Jensen illustrate 0.7. Schema constraints: Minimum: 0; Maximum: 1; retained by Human's schema refinement. */
  eumelaninShare: number;

  /**
   * Dermal haemoglobin volume fraction, dimensionless; the model range of Donner and Jensen is about 0.001 to 0.1 and site maxima reach about 0.3. Schema constraints: Minimum: 0.001; Maximum: 0.32; retained by Human's schema refinement. */
  haemoglobin: number;

  /** Iris colour, the same for both eyes. */
  iris: AutoMovieHumanIrisColor;
}
