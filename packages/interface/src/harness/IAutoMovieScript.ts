import { IAutoMovieBeat } from "./IAutoMovieBeat";
import { IAutoMovieCastMember } from "./IAutoMovieCastMember";
import { IAutoMovieScriptNode } from "./IAutoMovieScriptNode";

/** The script: the macro plan the rest of the production works from. */
export interface IAutoMovieScript {
  /** One-sentence summary of the film. */
  logline: string;

  /** The intent / mood the shots should serve. */
  theme: string;

  /** Everyone who appears. */
  cast: IAutoMovieCastMember[];

  /** The ordered beats (each becomes a shot). */
  beats: IAutoMovieBeat[];

  /**
   * The screenplay refinement tree ({@link IAutoMovieScriptNode}, D013): intent
   * → acts/scenes/groups → beat nodes carrying stage direction, dialogue, and
   * shot captions. Evolving-schema optional: absent means the flat `beats` list
   * is the whole authored structure (fully backward-compatible); when present,
   * beat-kind nodes join `beats` 1:1 and the tree validates on commit.
   */
  tree?: IAutoMovieScriptNode[] | null;
}
