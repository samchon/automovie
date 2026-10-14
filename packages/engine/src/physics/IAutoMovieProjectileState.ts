import { IAutoMovieVector3 } from "@automovie/interface";

/** Position + velocity of a projectile at one instant.
 *
 * @evidence contracts/common.md#principled-implementation Separate position in metres from velocity in metres per second so projectileAt can return both results of the same constant-acceleration time evaluation; validity is admitted by that producer, not this structural type.
 * @evidence contracts/common.md#clear-and-simple-design Two vectors represent one instantaneous state without retaining launch data or trajectory history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No collider, asset or fixture changes the representation; this state does not promise finite results when admitted finite inputs overflow arithmetic.
 * @evidence contracts/common.md#meaningful-documentation Members give world-space units and belong to the returned state; no acceleration or sample time is stored.
 * @evidence contracts/performance.md#efficient-algorithms The record has two fixed-size vectors; evaluating the equations belongs to projectileAt rather than the type.
 * @evidence contracts/performance.md#reuse-equivalent-work projectileAt returns fresh state vectors for each requested instant; the type supplies no memoization or shared mutable history.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the two vectors for its state lifetime; the declaration owns no handle, worker or retained collection.
 *
 * @author Samchon
 */
export interface IAutoMovieProjectileState {
  /** Projectile position in world meters. */
  position: IAutoMovieVector3;

  /** Projectile velocity in world meters per second. */
  velocity: IAutoMovieVector3;
}
