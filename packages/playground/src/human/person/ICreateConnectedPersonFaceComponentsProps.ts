import type { IAutoMovieHumanFaceComponentTree } from "@automovie/human";

/**
 * Inputs of `createConnectedPersonFaceComponents`: the face editor's anatomical
 * component tree, the person generation's head view basis it is bound to, and
 * the face channels the person edits through another owner (the body
 * channels a face channel aliases).
 *
 * @evidence contracts/common.md#principled-implementation The adapter receives the canonical face taxonomy, exact paired head-view basis identity and channel exclusions from the person generation's other owners.
 * @evidence contracts/common.md#clear-and-simple-design These inputs separate classification provenance from pruning and the downstream exact-coverage/basis validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Excluded aliases are not independently edited and a supplied basis string is not itself proof that every tree member has source support.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies canonical tree, generation basis and other-owner exclusion roles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The properties implement no tree traversal or channel membership validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Inputs declare no pruned-tree cache or geometry equivalence relation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed metadata arrays and basis identity acquire no form, worker or renderer resource.
 *
 * @author Samchon
 */
export interface ICreateConnectedPersonFaceComponentsProps {
  /** The face editor's anatomical component tree (`connectedFaceComponents`). */
  tree: IAutoMovieHumanFaceComponentTree;

  /** The head view basis identity the person's face section edits. */
  basis: string;

  /** Face channels the person edits through another owner; they leave the tree. */
  excluded: readonly string[];
}
