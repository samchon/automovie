import { AutoMovieArchetypeUnits } from "../../core/AutoMovieArchetypeUnits";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { DOG_BODY_MEASURES } from "./constants/DOG_BODY_MEASURES";
import type { IDogBodyMeasures } from "./structures/IDogBodyMeasures";
import type { DogCohort } from "./typings/DogCohort";

/*
 * Convert the selected cohort's measured height and girth to metres.
 */
export function dogModelDimensions(
  cohort: DogCohort,
): Readonly<
  Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
> {
  const measures: Readonly<IDogBodyMeasures> = DOG_BODY_MEASURES[cohort];
  return {
    withersHeight: measures.withers * AutoMovieArchetypeUnits.CENTIMETRE,
    girth: measures.girth * AutoMovieArchetypeUnits.CENTIMETRE,
  };
}
