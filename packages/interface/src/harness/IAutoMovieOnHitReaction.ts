/**
 * The recoil an {@link IAutoMovieLaunchAction} schedules on whatever its
 * projectile strikes, at the engine-computed contact time rather than a
 * hand-timed one.
 *
 * `compileLaunch` turns it into an ordinary `react` action on the struck node,
 * starting at the impact with an `"auto"` span and a blow coming from one metre
 * up the projectile's incoming path, and `performShot` adds that action to the
 * performance under the launch's `onHit` path. The reaction needs a single
 * struck actor, so performShot refuses onHit for a point or group aim, which
 * identifies no individual struck body, and for a camera, which cannot perform.
 * Those target kinds remain valid flight aims when onHit is absent.
 */
export interface IAutoMovieOnHitReaction {
  /**
   * Blow strength within `[0, 1]`, refused outside it. The reference
   * synthesizer scales the flinch's peak deflection in proportion.
   */
  force: number;

  /**
   * Whether the blow is meant to floor or unseat the target. The reference
   * synthesizer flinches harder and the launch emits a `fall` event, but no
   * fall or dismount motion is produced.
   */
  unbalance?: boolean;
}
