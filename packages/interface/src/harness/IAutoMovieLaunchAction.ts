import { IAutoMovieActionBase } from "./IAutoMovieActionBase";
import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";
import { IAutoMovieOnHitReaction } from "./IAutoMovieOnHitReaction";

/**
 * Loose a projectile toward a target; engine: `projectileAt` +
 * `projectileSphereHit` (it leads a moving target). Because the **contact time
 * is computed by the engine**, the model cannot hand-time the target's
 * reaction; instead give `onHit`, and the engine schedules the target's `react`
 * at the **detected** moment of impact (the reactive event: "shoot him off his
 * horse" without knowing when the arrow lands).
 */
export interface IAutoMovieLaunchAction extends IAutoMovieActionBase {
  /** Selects a projectile launch as the action family. */
  verb: "launch";

  /** What is thrown (a scene-node prop, or a named projectile). */
  projectile: string;

  /** Who/what it is aimed at. */
  at: IAutoMovieActionTarget;

  /** Launch speed (m/s). */
  speed: number;

  /**
   * The reaction the engine applies to the struck target at the detected hit.
   */
  onHit?: IAutoMovieOnHitReaction;
}
