import { IAutoMovieActPayload } from "./IAutoMovieActPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A dramatic act of the screenplay tree.
 *
 * `validateScriptTree` accepts an act under the intent or a group. The plain-text screenplay prints it as an `ACT, <purpose>` heading before its children; no compiler stage reads it.
 *
 * @evidence contracts/common.md#principled-implementation An inner node of the refinement tree whose allowed parents come from the validator's parent-kind table, so an act can never hang under a scene or a beat.
 * @evidence contracts/common.md#clear-and-simple-design Dramatic purpose lives in the act payload; graph identity and refinement edges are inherited, so a screenplay heading adds no staging or timing fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Acts are optional structure; a short film may refine the intent straight into beats, and no stage requires or infers an act.
 * @evidence contracts/common.md#meaningful-documentation States the allowed parents, how the screenplay prints it, and that no compiler stage reads it; members give the discriminator and payload roles.
 * @author Samchon
 */
export interface IAutoMovieScriptActNode extends IAutoMovieScriptNodeBase {
  /** Selects an act node. */
  kind: "act";

  /** The act's dramatic purpose. */
  payload: IAutoMovieActPayload;
}
