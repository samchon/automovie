import { IAutoMovieBeat } from "./IAutoMovieBeat";
import { IAutoMovieCastMember } from "./IAutoMovieCastMember";
import { IAutoMovieScriptNode } from "./IAutoMovieScriptNode";

/**
 * The script: the plan every later stage works from, naming who appears and the ordered beats each shot realizes.
 *
 * The stages join on its ids. `forgeCast` and `stageScene` refuse a repeated cast node, and `blockBeat` and `performShot` refuse a repeated beat id, because each looks a beat up by id. `performShot` gives the shot it builds for a beat the id `shot:<beat>`. The production store refuses a stored script with a blank logline or theme, no beats, a blank or repeated beat id or cast node, beat ids that collide when case is ignored, or a tree `validateScriptTree` rejects.
 *
 * @evidence contracts/common.md#principled-implementation Beats and cast members are id-keyed lists the stage gates index once and refuse duplicates in, so a lookup by beat or node names one record; the optional tree is checked against the flat beats by `validateScriptTree`, which requires each beat to be claimed by exactly one beat node.
 * @evidence contracts/common.md#clear-and-simple-design The flat beats are what the pipeline runs on and the tree is optional authoring structure over them, so a script without a tree is complete and the tree adds no field the stages need.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate ids are refused rather than resolved by position, and a tree that forgets a beat is refused rather than rendered without it.
 * @evidence contracts/common.md#meaningful-documentation States what the stages join on and which gates refuse duplicates, the shot id convention, and every stored-script refusal; members give each list's role and what an absent tree means.
 * @author Samchon
 */
export interface IAutoMovieScript {
  /**
   * One-sentence summary of the film; non-blank. The plain-text screenplay prints the intent root's logline instead when a tree is present.
   */
  logline: string;

  /** Non-blank intent or mood the shots should serve. */
  theme: string;

  /** Everyone who appears, each on a distinct scene node. */
  cast: IAutoMovieCastMember[];

  /** The ordered beats, at least one, with distinct ids; each becomes a shot. */
  beats: IAutoMovieBeat[];

  /**
   * The screenplay refinement tree from one intent down to beat nodes carrying stage direction, dialogue and shot captions, or absent or `null` when the flat {@link beats} are the whole authored structure. When present, its beat nodes join `beats` one to one.
   */
  tree?: IAutoMovieScriptNode[] | null;
}
