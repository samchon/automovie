/**
 * One planned shot, described in words before it is blocked and performed.
 *
 * Its id joins blocking/performance and historical per-beat slice files; performShot defaults shot identity to shot: plus this id unless its caller supplies shotId. Historical project validation requires nonblank unique ids without case collisions, nonblank name/summary and a finite positive duration hint. The engine uses the id, screenplay serialization prints name and summary in its flat form, and the hint supplies no computed duration.
 *
 * @evidence contracts/common.md#principled-implementation The beat id joins flat script, optional tree nodes, blocking/performance and historical slice addressing; shot:<id> is the default compiled name, not a mandatory identity. Stored-script case-collision refusal protects distinct slice identities on case-insensitive hosts.
 * @evidence contracts/common.md#clear-and-simple-design Four fields, an id, a title, a prose brief and a length hint, hold what a later stage needs to block the shot, with staging and dialogue kept in the script tree's beat payload.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The duration hint is not copied into the shot's duration by any stage, so a rough guess never silently becomes a timing fact; case collisions are refused before a file could be clobbered.
 * @evidence contracts/common.md#meaningful-documentation States what the id names and why its rules exist, every field rule project validation applies, and which consumer reads each field; members restate the unit and purpose of each.
 * @author Samchon
 */
export interface IAutoMovieBeat {
  /** Stable id, referenced by the shot built from it. */
  id: string;

  /** Short, non-empty title ("the charge", "the rear"). */
  name: string;

  /**
   * What happens in this beat, in non-empty prose: the brief the blocking
   * stage works to.
   */
  summary: string;

  /**
   * Rough length in seconds the script imagines, finite and `> 0`. No stage
   * derives the shot's duration from it.
   */
  durationHint: number;
}
