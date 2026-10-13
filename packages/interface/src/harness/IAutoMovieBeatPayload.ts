import { IAutoMovieDialogueLine } from "./IAutoMovieDialogueLine";

/**
 * The beat payload, the script tree's authored leaf level: stage direction,
 * dialogue, and the shot caption. A beat node joins the script's flat
 * {@link IAutoMovieBeat} list one to one through {@link beat}; the compiled
 * shot (`shot.id = "shot:" + beat`) is the computed leaf below it.
 *
 * `validateScriptTree` refuses a `beat` that names no script beat or one
 * another beat node already claims, a dialogue anchor that is negative or not
 * finite, and, when a tree is present, a script beat no beat node refines.
 * Project validation also requires a non-empty `direction` and, when present,
 * a non-blank `caption`.
 *
 * @evidence contracts/common.md#principled-implementation The payload is joined to the flat beat list by id, a one-to-one mapping `validateScriptTree` enforces in both directions, so the tree refines beats without becoming a second source of shot identity.
 * @evidence contracts/common.md#clear-and-simple-design Direction, dialogue and caption are the prose a beat carries for people and exporters; timing, staging and actions stay in the shot program, so this record holds no computed field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A blank caption is refused rather than read as no caption, so `null` is the only spelling of absence, and no compiler stage parses the direction to derive actions.
 * @evidence contracts/common.md#meaningful-documentation States the join to the beat list and the shot id, every refusal from the tree validator and project validation, and per member its readers, its ordering, and what `null` means.
 * @author Samchon
 */
export interface IAutoMovieBeatPayload {
  /** Id of the flat {@link IAutoMovieScript.beats} entry this node refines. */
  beat: string;

  /**
   * Stage direction: what happens, in non-empty prose. `renderScreenplay`
   * prints it under the beat heading.
   */
  direction: string;

  /** Spoken lines in order, possibly empty. */
  dialogue: IAutoMovieDialogueLine[];

  /**
   * How this shot should read, for the human reviewer and the diffusion pass,
   * or `null` for no caption. `planCaptionSidecar` exports it through
   * `beatCaptions`, and `renderScreenplay` prints it as a `[Shot: ...]` line.
   */
  caption: string | null;
}
