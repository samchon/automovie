/**
 * One planned shot, described in words before it is blocked and performed.
 *
 * Its `id` names the shot built from it (`shot:` + id) and the project's
 * per-beat slice files, so ids must be non-blank, unique, and free of
 * case-insensitive collisions.
 *
 * @evidence contracts/common.md#principled-implementation A prose plan keyed by a stable id, joined to its compiled shot by the `shot:` prefix and to an optional script-tree beat node through `IAutoMovieBeatPayload.beat`.
 * @evidence contracts/common.md#clear-and-simple-design Four fields, identity, a short name, the blocking brief and a length hint; direction, dialogue and captions live on the tree's beat payload instead of widening this record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No beat id is special-cased; the uniqueness, case-collision and non-blank checks exist because the id becomes a shot id and a slice filename, and `durationHint` stays a hint that blocking may change.
 * @evidence contracts/common.md#meaningful-documentation States how the id is reused, its uniqueness rules, the role of `summary`, and that `durationHint` is a positive estimate in seconds.
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
