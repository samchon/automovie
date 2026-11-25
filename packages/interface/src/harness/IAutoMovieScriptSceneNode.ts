import type { IAutoMovieScenePayload } from "./IAutoMovieScenePayload";
import type { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A scene of the screenplay tree, at the slug level.
 *
 * `validateScriptTree` accepts a scene under the intent, an act or a group. The
 * plain-text screenplay prints its slug and description, and the caption
 * sidecar labels every beat beneath it with the slug until a deeper scene
 * replaces it.
 */
export interface IAutoMovieScriptSceneNode extends IAutoMovieScriptNodeBase {
  /** Selects a scene node. */
  kind: "scene";

  /** The scene's slug and optional description. */
  payload: IAutoMovieScenePayload;
}
