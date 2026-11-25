/**
 * One planned shot, described in words before it is blocked and performed.
 *
 * Its id joins blocking/performance and historical per-beat slice files;
 * performShot defaults shot identity to shot: plus this id unless its caller
 * supplies shotId. Historical project validation requires nonblank unique ids
 * without case collisions, nonblank name/summary and a finite positive duration
 * hint. The engine uses the id, screenplay serialization prints name and
 * summary in its flat form, and the hint supplies no computed duration.
 */
export interface IAutoMovieBeat {
  /** Stable id, referenced by the shot built from it. */
  id: string;

  /** Short, non-empty title ("the charge", "the rear"). */
  name: string;

  /**
   * What happens in this beat, in non-empty prose: the brief the blocking stage
   * works to.
   */
  summary: string;

  /**
   * Rough length in seconds the script imagines, finite and `> 0`. No stage
   * derives the shot's duration from it.
   */
  durationHint: number;
}
