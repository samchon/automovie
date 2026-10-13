import { IAutoMovieIntentPayload } from "./IAutoMovieIntentPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/** The intent root: the film's single top thought. */
export interface IAutoMovieScriptIntentNode extends IAutoMovieScriptNodeBase {
  /** Discriminator. */
  kind: "intent";

  /** What this level of thought carries (D014: no uniform CoT slots). */
  payload: IAutoMovieIntentPayload;
}
