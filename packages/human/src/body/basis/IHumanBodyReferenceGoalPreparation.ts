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
 * @evidence contracts/common.md#principled-implementation Keeps converted source rows and their prepared reference frame together for weights, correctives and final pose consumers.
 * @evidence contracts/common.md#clear-and-simple-design One document and its optional shared rig describe the preparation boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The effective source rows do not replace the caller's saved goals, and a supplied rig is not recomputed from another pose.
 * @evidence contracts/common.md#meaningful-documentation States omission, saved/effective ownership and the prepared-rig dependency.
 * @evidence contracts/modeling.md#spatial-conventions Source pose degrees accompany the rig's body-space metre frames and unit quaternions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record carries rig state and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The saved reference goals and their converter own authored motion meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry No primitive population is selected.
 * @evidenceExclude contracts/modeling.md#shared-boundaries No surface boundary is constructed.
 * @evidenceExclude contracts/modeling.md#rendered-observation The performed body assembly observes the resulting source pose.
 * @evidence contracts/anatomy.md#anatomical-source The prepared source rig supplies conventional frames, not personal joint acquisition or clinical capacity.
 * @evidenceExclude contracts/anatomy.md#permitted-range The preparation and final pose owners admit their values before publishing a performed result.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This internal result preserves the existing named goal conversion without introducing public geometry inputs.
 * @author Samchon
 */
export interface IHumanBodyReferenceGoalPreparation {
  /** Internal document whose source-pose rows drive correctives and coordination. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** The same goal-independent shaped rig used by reference conversion and final FK. */
  rig?: IAutoMovieHumanBodySkeletonRig;
}
