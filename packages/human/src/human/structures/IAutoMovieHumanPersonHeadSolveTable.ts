/**
 * Which head measurements the head solve meets, which it pursues second, and
 * which face channels it moves (`HUMAN_PERSON_HEAD_SOLVE`).
 *
 * @evidence contracts/common.md#principled-implementation The solve's targets and channels are data beside the rules they read.
 * @evidence contracts/common.md#clear-and-simple-design Three name lists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every listed name must exist in the rule table or the head view; a missing one refuses.
 * @evidence contracts/common.md#meaningful-documentation States what each list names.
 * @evidence contracts/modeling.md#parameter-channels Each listed channel drives a distinct effect on the head measurements.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The record holds names, no coordinate.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record is not displayed; the solved person is observed on the viewer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule table cites each measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The channels' own envelopes bound the solve.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record names the solve's inputs; it converts none.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadSolveTable {
  /** Names of `HUMAN_PERSON_HEAD_MEASUREMENTS` rules the solve meets. */
  measurements: string[];

  /**
   * Names of rules the solve pursues second, by least squares within the
   * freedom the met measurements leave; a target for one is optional and its
   * miss is reported, never refused.
   */
  secondary: string[];

  /** Head view face shape channels the solve sets. */
  channels: string[];
}
