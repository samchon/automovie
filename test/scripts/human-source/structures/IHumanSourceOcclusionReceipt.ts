import type { IHumanSourceOcclusionToothReading } from "./IHumanSourceOcclusionToothReading.ts";

/**
 * The rigid opening of the mandibular dentition that clears the neutral
 * occlusion, and what the occlusion reads there.
 *
 * @author Samchon
 */
export interface IHumanSourceOcclusionReceipt {
  /** Unit occlusal direction: away from the maxillary arch, in head-frame metres. */
  direction: number[];

  /** Least opening along that direction, after the setback, with no overlapping crown pair, in metres. */
  translationMetres: number;

  /** Overlapping maxillary-mandibular crown pairs before the translation. */
  overlappingPairsBefore: number;

  /** Overlapping pairs after it. */
  overlappingPairsAfter: number;

  /** Central incisor overbite before and after, in metres. */
  overbiteBeforeMetres: number;

  /** See `overbiteBeforeMetres`. */
  overbiteAfterMetres: number;

  /** Unit forward direction of the maxillary arch frame. */
  forward: number[];

  /** Setback of the mandibular dentition against that forward direction, in metres; negative moves it forward. */
  retrusionMetres: number;

  /** Central incisor overjet before and after, in metres. */
  overjetBeforeMetres: number;

  /** See `overjetBeforeMetres`. */
  overjetAfterMetres: number;

  /** Posterior mandibular crowns (positions 4 to 8) against the maxillary arch after the translation. */
  posteriorContacts: IHumanSourceOcclusionToothReading[];

  /** Anterior mandibular crowns (positions 1 to 3) against the maxillary arch after the translation. */
  anteriorClearances: IHumanSourceOcclusionToothReading[];

  /** Dental vertices the mandible owns, which the translation carries. */
  mandibularVertices: number;

  /** True when the overbite after the translation lies in the authored tolerance. */
  overbiteWithinTolerance: boolean;

  /** What this reading does not establish. */
  qualification: string;
}
