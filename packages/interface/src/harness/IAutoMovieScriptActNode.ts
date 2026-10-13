import { IAutoMovieActPayload } from "./IAutoMovieActPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/** A dramatic act. */
export interface IAutoMovieScriptActNode extends IAutoMovieScriptNodeBase {
  /** Discriminator. */
  kind: "act";

  /** What this level of thought carries. */
  payload: IAutoMovieActPayload;
}
