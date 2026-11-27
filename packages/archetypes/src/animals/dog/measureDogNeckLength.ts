import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { buildDogBody } from "./buildDogBody";
import type { DogCohort } from "./typings/DogCohort";

/*
 * Measure the constructed neck in metres from the same rig used to place tack.
 */
export function measureDogNeckLength(
  cohort: DogCohort,
  dimensions: Readonly<
    Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
  >,
): number {
  const rig: AutoMovieArchetypeQuadrupedBody.IRig =
    AutoMovieArchetypeQuadrupedBody.rig(buildDogBody(cohort), dimensions);
  return AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(rig.poll, rig.neck));
}
