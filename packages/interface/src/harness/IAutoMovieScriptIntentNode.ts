import { IAutoMovieIntentPayload } from "./IAutoMovieIntentPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * The root of the screenplay tree: the film's single top-level statement.
 *
 * `validateScriptTree` requires exactly one node with `parent: null` and requires it to be the intent; an intent with a parent is refused, so a tree has one intent. When a tree is present, the plain-text screenplay takes its logline and theme header from this node rather than from the flat script.
 *
 * @evidence contracts/common.md#principled-implementation The single root of a parent-pointer tree, enforced by counting `parent: null` nodes and refusing an intent that names a parent, so every chain `scriptAncestors` walks ends here.
 * @evidence contracts/common.md#clear-and-simple-design The shared node fields plus the `intent` discriminator and its own two-field payload; nothing else distinguishes the root.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A forest or a second root is refused rather than merged under an invented intent.
 * @evidence contracts/common.md#meaningful-documentation States the root and uniqueness rules, and which output reads its payload in place of the flat script fields; members give the discriminator and payload roles.
 * @author Samchon
 */
export interface IAutoMovieScriptIntentNode extends IAutoMovieScriptNodeBase {
  /** Selects the intent root. */
  kind: "intent";

  /** The film's logline and theme as the tree states them. */
  payload: IAutoMovieIntentPayload;
}
