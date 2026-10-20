import { IAutoMovieScenePayload } from "./IAutoMovieScenePayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/**
 * A scene of the screenplay tree, at the slug level.
 *
 * `validateScriptTree` accepts a scene under the intent, an act or a group. The plain-text screenplay prints its slug and description, and the caption sidecar labels every beat beneath it with the slug until a deeper scene replaces it.
 *
 * @evidence contracts/common.md#principled-implementation An inner node whose slug scopes its subtree: `beatCaptions` passes the nearest scene's slug down the walk, so a beat is labelled by the scene that contains it.
 * @evidence contracts/common.md#clear-and-simple-design The shared node fields plus the `scene` discriminator and the slug payload; the staged set is a separate scene record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No stage derives a set, light or camera from the slug; it is authoring text.
 * @evidence contracts/common.md#meaningful-documentation States the allowed parents and the two readers of its slug, including how the caption label is inherited; members give the discriminator and payload roles.
 */
export interface IAutoMovieScriptSceneNode extends IAutoMovieScriptNodeBase {
  /** Selects a scene node. */
  kind: "scene";

  /** The scene's slug and optional description. */
  payload: IAutoMovieScenePayload;
}
