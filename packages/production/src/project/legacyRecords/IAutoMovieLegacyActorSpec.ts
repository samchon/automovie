/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieLegacyActorContext } from "./IAutoMovieLegacyActorContext";

/**
 * A stored actor context as `actors/<node>.json` holds it (#1176): the
 * beat-invariant half of {@link IAutoMovieLegacyActorContext}, everything but
 * `position`/`facingDeg`/`gaitPhase`, which are per-beat openings the
 * continuity seed (or the caller) supplies. A resident `perform` with explicit
 * `actors` writes these through; later resident performs omit `actors` and read
 * them back.
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
