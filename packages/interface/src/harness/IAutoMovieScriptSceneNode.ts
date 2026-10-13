import { IAutoMovieScenePayload } from "./IAutoMovieScenePayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/** A scene (slug level). */
export interface IAutoMovieScriptSceneNode extends IAutoMovieScriptNodeBase {
  /** Discriminator. */
  kind: "scene";

  /** What this level of thought carries. */
  payload: IAutoMovieScenePayload;
}
