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
 * @evidence contracts/common.md#principled-implementation A one-to-one join from tree leaf to flat beat by id, which `validateScriptTree` enforces in both directions, so the tree refines the beat list without replacing it.
 * @evidence contracts/common.md#clear-and-simple-design Direction, dialogue and caption live on the leaf payload, keeping `IAutoMovieBeat` the minimal plan and letting a treeless script stay valid.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No beat is special-cased; `caption: null` is the contract spelling of no caption, and a blank caption string is refused rather than read as none.
 * @evidence contracts/common.md#meaningful-documentation States the join rule and its refusals, the derived shot id, the non-empty rules, the dialogue order, and both readers of `caption`.
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
