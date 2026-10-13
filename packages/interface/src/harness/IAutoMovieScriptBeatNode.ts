import { IAutoMovieBeatPayload } from "./IAutoMovieBeatPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/** The authored leaf: one beat's direction, dialogue, and caption. */
export interface IAutoMovieScriptBeatNode extends IAutoMovieScriptNodeBase {
  /** Discriminator. */
  kind: "beat";

  /** What this level of thought carries. */
  payload: IAutoMovieBeatPayload;
}
