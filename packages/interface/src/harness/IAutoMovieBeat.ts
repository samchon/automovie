/**
 * One planned shot, described in words before it is blocked and performed.
 *
 * Its `id` names the shot built from it (`shot:` + id) and the project's
 * per-beat slice files, so project validation requires ids to be non-blank,
 * unique, and free of case-insensitive collisions. It also requires a
 * non-empty `name` and `summary` and a finite `durationHint` above zero. Only
 * the id is read by the engine; `renderScreenplay` prints the name, and the
 * summary and duration hint are read by the model and people.
 *
 * @evidence contracts/common.md#principled-implementation The beat is the join key between the flat script, the script tree's beat nodes, the compiled shot `shot:<id>` and the per-beat slice files, so its id rules are the filename rules of a case-insensitive file system.
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
