import type { IAutoMovieHumanTraits } from "@automovie/interface";
import type { tags } from "typia";

import type { IAutoMovieHumanBuildTraitsSchema } from "./IAutoMovieHumanBuildTraitsSchema";

/** Typia admission/schema metadata for IAutoMovieHumanTraits. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanTraitsSchema = IAutoMovieHumanTraits & {
  /**
   * Age in years, fractional for infants. No upper limit or reference-survey coverage is implied by this field.
   */
  age: number & tags.Minimum<0>;

  /**
   * Stature in millimetres, or null for the reference population's median at the given sex and age.
   */
  stature: (number & tags.Minimum<400> & tags.Maximum<2500>) | null;

  /** Skin pigmentation independent of population: 0 is pale (melanin fraction 0.013), 1 is dark (0.43), interpolated logarithmically. Omitted, no pigmentation override is requested; detailed identities can additionally set eumelanin share and haemoglobin. This is a conventional authoring scale, not a clinical phototype. */
  skinTone?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Build offsets from the population mean. */
  build: IAutoMovieHumanBuildTraitsSchema;
};
