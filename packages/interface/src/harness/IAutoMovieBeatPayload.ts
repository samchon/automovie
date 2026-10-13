import { IAutoMovieDialogueLine } from "./IAutoMovieDialogueLine";

/**
 * The beat payload, the tree's authored leaf level: stage direction, dialogue,
 * and the shot caption. A beat node joins the script's flat
 * {@link IAutoMovieBeat} list 1:1 through {@link beat}; the compiled shot
 * (`shot.id = "shot:" + beat`) is the graph's computed leaf below it.
 *
 * `validateScriptTree` refuses a `beat` that names no script beat or one
 * another beat node already claims, and, when a tree is present, a script beat
 * no beat node refines.
 *
 * @author Samchon
 */
export interface IAutoMovieBeatPayload {
  /** Id of the flat {@link IAutoMovieScript.beats} entry this node refines. */
  beat: string;

  /**
   * Stage direction: what happens, in non-empty prose (the blocking brief).
   */
  direction: string;

  /** Spoken lines in order, possibly empty. */
  dialogue: IAutoMovieDialogueLine[];

  /**
   * How this shot should read, for the human reviewer AND the diffusion pass
   * (the caption sidecar exports it, and the screenplay prints it as a `[Shot:
   * ...]` line), or `null` for no caption. A blank string is refused.
   */
  caption: string | null;
}
