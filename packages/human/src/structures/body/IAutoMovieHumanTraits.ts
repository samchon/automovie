import { tags } from "typia";

import { AutoMovieHumanPopulation } from "../../typings/AutoMovieHumanPopulation";
import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { IAutoMovieHumanBuildTraits } from "./IAutoMovieHumanBuildTraits";

/**
 * A beginner's description of a person: sex, age, stature, reference population and build.
 *
 * This is an authored parameter description. No converter or statistical expansion is supplied.
 *
 * Build traits are normalized offsets: zero is the reference population's mean for the given sex and age, the sign states the direction, and one is a large but living departure that a converter documents in its own units.
 */
export interface IAutoMovieHumanTraits {
  /** Sex category associated with the requested reference statistics. */
  sex: AutoMovieHumanSex;

  /**
   * Age in years, fractional for infants. No upper limit is imposed; a converter documents the ages its data covers and how it treats the rest.
   */
  age: number & tags.Minimum<0>;

  /**
   * Stature in millimetres, or null for the reference population's median at the given sex and age.
   */
  stature: (number & tags.Minimum<400> & tags.Maximum<2500>) | null;

  /** Requested reference population. */
  population: AutoMovieHumanPopulation;

  /** Skin pigmentation independent of population: 0 is pale (melanin fraction 0.013), 1 is dark (0.43), interpolated logarithmically. Omitted, no pigmentation override is requested; detailed identities can additionally set eumelanin share and haemoglobin. This is a conventional authoring scale, not a clinical phototype. */
  skinTone?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Build offsets from the population mean. */
  build: IAutoMovieHumanBuildTraits;
}
