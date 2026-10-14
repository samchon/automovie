import type { IAutoMovieLegacyActorContext } from "./IAutoMovieLegacyActorContext";

/**
 * A stored actor context as `actors/<node>.json` holds it (#1176): the
 * beat-invariant half of {@link IAutoMovieLegacyActorContext}, everything but
 * `position`/`facingDeg`/`gaitPhase`, which are per-beat openings the
 * continuity seed (or the caller) supplies. A resident `perform` with explicit
 * `actors` writes these through; later resident performs omit `actors` and read
 * them back.
 *
 * @evidence contracts/common.md#principled-implementation Omit removes position, facingDeg and gaitPhase from the historical actor context and adds the node storage identity; typed persistence preserves the remaining fields.
 * @evidence contracts/common.md#clear-and-simple-design AutoMovieProject owns keyed actor reads and transactional saves; the legacy importer counts these records when inventorying old projects.
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
