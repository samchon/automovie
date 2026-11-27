import type { AutoMovieHumanPopulation } from "./AutoMovieHumanPopulation";
import type { AutoMovieHumanSex } from "./AutoMovieHumanSex";
import type { IAutoMovieHumanBuildTraits } from "./IAutoMovieHumanBuildTraits";

/**
 * A beginner's description of a person: sex, age, stature, reference population
 * and build.
 *
 * This is an authored parameter description. No converter or statistical
 * expansion is supplied.
 *
 * Build traits are normalized authoring offsets: zero denotes the requested
 * reference population's mean for the given sex and age, and the sign states
 * the direction. These offsets do not define a conversion to physical
 * measurements.
 */
export interface IAutoMovieHumanTraits {
  /** Sex category associated with the requested reference statistics. */
  sex: AutoMovieHumanSex;

  /**
   * Age in years, fractional for infants. No upper limit or reference-survey
   * coverage is implied by this field. Schema constraints: Minimum: 0; retained
   * by Human's schema refinement.
   */
  age: number;

  /**
   * Stature in millimetres, or null for the reference population's median at
   * the given sex and age. Schema constraints: Minimum: 400; Maximum: 2500;
   * retained by Human's schema refinement.
   */
  stature: number | null;

  /** Requested reference population. */
  population: AutoMovieHumanPopulation;

  /**
   * Skin pigmentation independent of population: 0 is pale (melanin fraction
   * 0.013), 1 is dark (0.43), interpolated logarithmically. Omitted, no
   * pigmentation override is requested; detailed identities can additionally
   * set eumelanin share and haemoglobin. This is a conventional authoring
   * scale, not a clinical phototype. Schema constraints: Minimum: 0; Maximum:
   * 1; retained by Human's schema refinement.
   */
  skinTone?: number;

  /** Build offsets from the population mean. */
  build: IAutoMovieHumanBuildTraits;
}
