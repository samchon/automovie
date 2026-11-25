import type { IAutoMovieGroupPayload } from "./IAutoMovieGroupPayload";
import type { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A grouping of sibling nodes, such as a montage or an exchange.
 *
 * `validateScriptTree` accepts a group under the intent, an act or a scene, and
 * accepts acts, scenes and beats under it, but not another group. The
 * plain-text screenplay prints its rationale in brackets before its children.
 */
export interface IAutoMovieScriptGroupNode extends IAutoMovieScriptNodeBase {
  /** Selects a group node. */
  kind: "group";

  /** Why the grouped nodes belong together. */
  payload: IAutoMovieGroupPayload;
}
