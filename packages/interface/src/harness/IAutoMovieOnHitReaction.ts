/**
 * The recoil an {@link IAutoMovieLaunchAction} schedules on whatever its
 * projectile strikes, at the engine-computed contact time rather than a
 * hand-timed one.
 *
 * `compileLaunch` turns it into an ordinary `react` action on the struck node,
 * starting at the impact with an `"auto"` span and a blow coming from one
 * metre up the projectile's incoming path, and `performShot` adds that action
 * to the performance under the launch's `onHit` path. The reaction needs a
 * single struck node, so it is withheld without a violation when the aim is a
 * point or a group; the `contact` event is still emitted. `performShot`
 * refuses an `onHit` aimed at a camera, which cannot perform.
 *
 * @evidence contracts/common.md#principled-implementation The recoil's direction comes from the solved landing velocity, falling back to the origin-to-impact sightline when the projectile arrives still, so the body flinches along the real incoming path.
 * @evidence contracts/common.md#clear-and-simple-design Two fields mirror the `react` verb's force and unbalance, because the engine expands this record into a `react` and reuses that verb's synthesis and range-of-motion gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No target is special-cased; a reaction with no single node to recoil is withheld rather than assigned to a group member, a stated rule `performShot`'s tests pin.
 * @evidence contracts/common.md#meaningful-documentation States the expansion into `react` with its start, span and source, the withheld case and its remaining event, and the camera refusal; members give the force range and its effect and what `unbalance` does and does not do.
 * @author Samchon
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
