import type { IAutoMovieHumanFaceEyelidPhenotype } from "./IAutoMovieHumanFaceEyelidPhenotype";

/**
 * Independently authored left and right resting lid morphology.
 * Omission of one side retains its complete source appearance; no symmetry
 * expansion or ancestry preset fills that side.
 *
 * @evidence contracts/common.md#principled-implementation Independent anatomical sides select authored resting lid traits while an omitted side retains its source identity rather than a contralateral expansion.
 * @evidence contracts/common.md#clear-and-simple-design Two optional EyelidPhenotype owners separate bilateral selection from shared morphology resolution and current blink/gaze.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ancestry or symmetry preset fills missing sides, and a selected side cannot simultaneously author duplicate raw source-row controls.
 * @evidence contracts/common.md#meaningful-documentation The comment defines whole-side omission and members identify anatomical left/right owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This grouping performs no source deformation or conflict admission.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared field shape implements no bilateral geometry cache or reuse policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The personal document owns selected side records and no source/task handle is acquired.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyelidPhenotypes {
  /** Anatomical-left visible lid traits. */
  left?: IAutoMovieHumanFaceEyelidPhenotype;

  /** Anatomical-right visible lid traits. */
  right?: IAutoMovieHumanFaceEyelidPhenotype;
}
