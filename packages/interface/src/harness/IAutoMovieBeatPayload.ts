import type { IAutoMovieDialogueLine } from "./IAutoMovieDialogueLine";

/**
 * The script tree's authored beat leaf holds direction, dialogue and caption
 * and joins the flat beat list one to one by beat id. performShot defaults
 * compiled identity to shot: plus that beat, while an explicit caller shotId
 * may differ.
 *
 * `validateScriptTree` refuses a `beat` that names no script beat or one
 * another beat node already claims, a dialogue anchor that is negative or not
 * finite, and, when a tree is present, a script beat no beat node refines.
 * Project validation also requires a non-empty `direction` and, when present, a
 * non-blank `caption`.
 */
export interface IAutoMovieBeatPayload {
  /** Id of the flat {@link IAutoMovieScript.beats} entry this node refines. */
  beat: string;

  /**
   * Stage direction: what happens, in non-empty prose.
   * `AutoMovieRenderScreenplay.render` prints it under the beat heading.
   */
  direction: string;

  /** Spoken lines in order, possibly empty. */
  dialogue: IAutoMovieDialogueLine[];

  /**
   * How this shot should read, for the human reviewer and the diffusion pass,
   * or `null` for no caption. `planCaptionSidecar` exports it through
   * `beatCaptions`, and `AutoMovieRenderScreenplay.render` prints it as a
   * `[Shot: ...]` line.
   */
  caption: string | null;
}
