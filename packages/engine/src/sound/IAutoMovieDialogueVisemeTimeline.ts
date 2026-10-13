import { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";

/** Compiled dialogue mouth layer for one actor. */
export interface IAutoMovieDialogueVisemeTimeline {
  /** Joined dialogue line identity. */
  line: string;
  /** Resolved actor node. */
  actor: string;
  /** Gap-free ranges covering the line, including explicit rest. */
  ranges: IAutoMovieDialogueMouthRange[];
}
