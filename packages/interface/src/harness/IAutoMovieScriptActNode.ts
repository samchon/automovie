import type { IAutoMovieActPayload } from "./IAutoMovieActPayload";
import type { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A dramatic act of the screenplay tree.
 *
 * `validateScriptTree` accepts an act under the intent or a group. The
 * plain-text screenplay prints it as an `ACT, <purpose>` heading before its
 * children; no compiler stage reads it.
 */
export interface IAutoMovieScriptActNode extends IAutoMovieScriptNodeBase {
  /** Selects an act node. */
  kind: "act";

  /** The act's dramatic purpose. */
  payload: IAutoMovieActPayload;
}
