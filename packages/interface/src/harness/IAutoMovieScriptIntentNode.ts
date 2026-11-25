import type { IAutoMovieIntentPayload } from "./IAutoMovieIntentPayload";
import type { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * The root of the screenplay tree: the film's single top-level statement.
 *
 * `validateScriptTree` requires exactly one node with `parent: null` and
 * requires it to be the intent; an intent with a parent is refused, so a tree
 * has one intent. When a tree is present, the plain-text screenplay takes its
 * logline and theme header from this node rather than from the flat script.
 */
export interface IAutoMovieScriptIntentNode extends IAutoMovieScriptNodeBase {
  /** Selects the intent root. */
  kind: "intent";

  /** The film's logline and theme as the tree states them. */
  payload: IAutoMovieIntentPayload;
}
