import type { IHumanFaceHairStationStep } from "./IHumanFaceHairStationStep";
import type { createHumanFaceHairExteriorInterval } from "./createHumanFaceHairExteriorInterval";

/**
 * The admitted chord of one rooted-stem station and the exterior interval that
 * certified it, returned by `stepHumanFaceHairRootedStem`.
 *
 * The walk appends the step's point and, through the interval, reads whether
 * the stem has reached full free clearance.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedStemOutcome {
  /** The admitted chord. */
  taken: IHumanFaceHairStationStep;

  /** The exterior interval that certified it. */
  interval: ReturnType<typeof createHumanFaceHairExteriorInterval>;
}
