/**
 * One planned shot, described in words before it is blocked and performed.
 *
 * Its `id` names the shot built from it (`shot:` + id) and the project's
 * per-beat slice files, so ids must be non-blank, unique, and free of
 * case-insensitive collisions.
 *
 * @author Samchon
 */
export interface IAutoMovieBeat {
  /** Stable id, referenced by the shot built from it. */
  id: string;

  /** Short, non-empty title ("the charge", "the rear"). */
  name: string;

  /**
   * What happens in this beat, in prose: the brief the blocking stage works to.
   */
  summary: string;

  /**
   * Rough length in seconds the script imagines, finite and `> 0`; blocking may
   * refine it.
   */
  durationHint: number;
}
