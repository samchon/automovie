import type { IHumanFaceHairStationStep } from "./IHumanFaceHairStationStep";
import type { createHumanFaceHairExteriorInterval } from "./createHumanFaceHairExteriorInterval";

/**
 * The admitted chord of one rooted-stem station and the exterior interval that
 * certified it, returned by `stepHumanFaceHairRootedStem`.
 *
 * The walk appends the step's point and, through the interval, reads whether
 * the stem has reached full free clearance.
 *
 * @evidence contracts/common.md#principled-implementation Returns the admitted chord together with the certificate the walk still needs.
 * @evidence contracts/common.md#clear-and-simple-design Two named members replace an implicit outer variable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only a certified chord is returned.
 * @evidence contracts/common.md#meaningful-documentation States what the walk does with each member.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The members state their frames.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no author channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidence contracts/modeling.md#emitted-geometry The step's point becomes an emitted station.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The interval owns the boundary proof.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical state only.
 * @evidenceExclude contracts/anatomy.md#permitted-range Defines no clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived state, not a personal control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootedStemOutcome {
  /** The admitted chord. */
  taken: IHumanFaceHairStationStep;

  /** The exterior interval that certified it. */
  interval: ReturnType<typeof createHumanFaceHairExteriorInterval>;
}
