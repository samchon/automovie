import type { IAutoMovieHumanTraits } from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanBuildTraitsSchema } from "./IAutoMovieHumanBuildTraitsSchema";

/**
 * Introductory Human authoring input for typia validation. Supply a sex and
 * reference population, age in years and normalized build offsets. Stature is
 * measured in millimetres or null to request a reference median. Skin tone is
 * optional.
 */
export type IAutoMovieHumanTraitsSchema = IAutoMovieHumanTraits & {
  /**
   * Age in years, fractional for infants. No upper limit or reference-survey coverage is implied by this field.
   */
  age: number & tags.Minimum<0>;

  /**
   * Stature in millimetres, or null for the reference population's median at the given sex and age.
   */
  stature: (number & tags.Minimum<400> & tags.Maximum<2500>) | null;

  /** Skin tone request independent of population, from pale (0) to dark (1). Omission leaves the override unspecified. */
  skinTone?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Build offsets from the population mean. */
  build: IAutoMovieHumanBuildTraitsSchema;
};
