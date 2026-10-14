import { IAutoMovieGroupPayload } from "./IAutoMovieGroupPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A grouping of sibling nodes, such as a montage or an exchange.
 *
 * `validateScriptTree` accepts a group under the intent, an act or a scene, and accepts acts, scenes and beats under it, but not another group. The plain-text screenplay prints its rationale in brackets before its children.
 *
 * @evidence contracts/common.md#principled-implementation An inner node of the refinement tree that may hold acts, scenes and beats, which lets an author bracket a run of scenes or beats without inventing an act.
 * @evidence contracts/common.md#clear-and-simple-design The grouping rationale is separate from the inherited graph edges, allowing the renderer to bracket siblings without inventing an act or scene slug.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stage reads a group to time or stage its children; ordering stays the children's declaration order.
 * @evidence contracts/common.md#meaningful-documentation States the allowed parents and children and how the screenplay prints it; members give the discriminator and payload roles.
 * @author Samchon
 */
export interface IAutoMovieScriptGroupNode extends IAutoMovieScriptNodeBase {
  /** Selects a group node. */
  kind: "group";

  /** Why the grouped nodes belong together. */
  payload: IAutoMovieGroupPayload;
}
