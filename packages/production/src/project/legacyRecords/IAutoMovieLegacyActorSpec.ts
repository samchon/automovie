import type { IAutoMovieLegacyActorContext } from "./IAutoMovieLegacyActorContext";

/**
 * Stored actor context keyed by scene node in actors/<encoded-node>.json, excluding position, facingDeg and gaitPhase from the historical context. AutoMovieProject writes caller-supplied records and reads filename/node identity without deep actor-context admission; this type does not establish an active performance host or beat-opening state.
 *
 * @evidence contracts/common.md#principled-implementation Omit removes position, facingDeg and gaitPhase from the historical actor context and adds the node storage identity; typed persistence preserves the remaining fields.
 * @evidence contracts/common.md#clear-and-simple-design AutoMovieProject owns keyed actor reads and revision-guarded saves; individual writes can remain after a later failure, and the legacy importer counts these records when inventorying old projects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No beat-specific opening is fabricated from a stored actor record and this type performs no runtime validation.
 * @evidence contracts/common.md#meaningful-documentation States actors-file identity and the separation between stored context and per-beat openings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Excluding opening fields and adding a storage key executes no directory scan or serialization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Actor keys address stored data and do not prove equivalent file observations or performance results.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resident registry owns context records while the interface starts no process, descriptor or task.
 * @author Samchon
 */
export interface IAutoMovieLegacyActorSpec extends Omit<
  IAutoMovieLegacyActorContext,
  "position" | "facingDeg" | "gaitPhase"
> {
  /**
   * The scene node / cast id this context belongs to (the storage key).
   */
  node: string;
}
