import type { IAutoMovieBeat } from "./IAutoMovieBeat";
import type { IAutoMovieCastMember } from "./IAutoMovieCastMember";
import type { IAutoMovieScriptNode } from "./IAutoMovieScriptNode";

/**
 * The script: the plan every later stage works from, naming who appears and the
 * ordered beats each shot realizes.
 *
 * Stages join on cast-node and beat ids, refusing repeated keys before lookup.
 * performShot defaults shot identity to shot:<beat>, while an explicit shotId
 * overrides it. The historical production script store refuses blank headers,
 * no beats, invalid/repeated cast or beat ids, case-colliding beat ids and
 * invalid optional trees; these structural checks do not grade the screenplay's
 * prose or automatically build one shot per beat.
 */
export interface IAutoMovieScript {
  /**
   * One-sentence summary of the film; non-blank. The plain-text screenplay
   * prints the intent root's logline instead when a tree is present.
   */
  logline: string;

  /** Non-blank intent or mood the shots should serve. */
  theme: string;

  /** Everyone who appears, each on a distinct scene node. */
  cast: IAutoMovieCastMember[];

  /** The ordered beats, at least one, with distinct ids; each becomes a shot. */
  beats: IAutoMovieBeat[];

  /**
   * The screenplay refinement tree from one intent down to beat nodes carrying
   * stage direction, dialogue and shot captions, or absent or `null` when the
   * flat {@link beats} are the whole authored structure. When present, its beat
   * nodes join `beats` one to one.
   */
  tree?: IAutoMovieScriptNode[] | null;
}
