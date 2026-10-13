/** One planned shot, described in words before it is blocked and performed. */
export interface IAutoMovieBeat {
  /** Stable id, referenced by the shot built from it. */
  id: string;

  /** Short title ("the charge", "the rear"). */
  name: string;

  /**
   * What happens in this beat, in prose: the brief the blocking stage works to.
   */
  summary: string;

  /** Rough length (seconds) the script imagines; blocking may refine it. */
  durationHint: number;
}
