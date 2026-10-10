import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * The effective source-pose document and its one goal-independent prepared rig.
 *
 * Reference-goal conversion retains this rig for final performance. An omitted
 * rig means no conversion was requested, so the ordinary pose owner prepares
 * it from the final shaped landmarks as before. The caller's saved reference
 * goals are not overwritten by this internal document.
 *
 * @author Samchon
 */
export interface IHumanBodyReferenceGoalPreparation {
  /** Internal document whose source-pose rows drive correctives and coordination. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** The same goal-independent shaped rig used by reference conversion and final FK. */
  rig?: IAutoMovieHumanBodySkeletonRig;
}
