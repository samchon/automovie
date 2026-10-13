import { IAutoMovieGroupPayload } from "./IAutoMovieGroupPayload";
import { IAutoMovieScriptNodeBase } from "./IAutoMovieScriptNodeBase";

/** A grouping of siblings (a montage, an exchange). */
export interface IAutoMovieScriptGroupNode extends IAutoMovieScriptNodeBase {
  /** Discriminator. */
  kind: "group";

  /** What this level of thought carries. */
  payload: IAutoMovieGroupPayload;
}
