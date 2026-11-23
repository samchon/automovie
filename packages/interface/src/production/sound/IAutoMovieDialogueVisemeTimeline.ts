import type { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";

/**
 * One actor's joined line intervals, including explicit rest gaps.
 */
export interface IAutoMovieDialogueVisemeTimeline {
  /** Joined dialogue line identity. */
  line: string;

  /** Resolved actor node. */
  actor: string;

  /** Gap-free ranges covering the line, including explicit rest. */
  ranges: IAutoMovieDialogueMouthRange[];
}
