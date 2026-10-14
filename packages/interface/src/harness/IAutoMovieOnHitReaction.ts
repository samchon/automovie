/**
 * The recoil an {@link IAutoMovieLaunchAction} schedules on whatever its projectile strikes, at the engine-computed contact time rather than a hand-timed one.
 *
 * `compileLaunch` turns it into an ordinary `react` action on the struck node, starting at the impact with an `"auto"` span and a blow coming from one metre up the projectile's incoming path, and `performShot` adds that action to the performance under the launch's `onHit` path. The reaction needs a single struck actor, so performShot refuses onHit for a point or group aim, which identifies no individual struck body, and for a camera, which cannot perform. Those target kinds remain valid flight aims when onHit is absent.
 *
 * @evidence contracts/common.md#principled-implementation The recoil's direction comes from the solved landing velocity, falling back to the origin-to-impact sightline when the projectile arrives still, so the body flinches along the real incoming path.
 * @evidence contracts/common.md#clear-and-simple-design Two fields mirror the `react` verb's force and unbalance, because the engine expands this record into a `react` and reuses that verb's synthesis and range-of-motion gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A point or group does not identify which actor was struck, so the gate refuses that onHit declaration rather than silently dropping it or choosing a group member; a camera cannot receive actor recoil.
 * @evidence contracts/common.md#meaningful-documentation States react expansion, impact timing and incoming source, the single-struck-actor requirement and point, group and camera refusals; members give force bounds and the limits of unbalance behavior.
 * @author Samchon
 */
export interface IAutoMovieOnHitReaction {
  /**
   * Blow strength within `[0, 1]`, refused outside it. The reference synthesizer scales the flinch's peak deflection in proportion.
   */
  force: number;

  /**
   * Whether the blow is meant to floor or unseat the target. The reference synthesizer flinches harder and the launch emits a `fall` event, but no fall or dismount motion is produced.
   */
  unbalance?: boolean;
}
