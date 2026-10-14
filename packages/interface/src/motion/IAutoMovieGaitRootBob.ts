/**
 * Vertical body-mass oscillation attached to a gait cycle. `gaitMotion` evaluates `center + amplitude * sin(2 * PI * cycle)` on local Y at each bake sample, with identity rotation and scale; absent rootBob leaves the root unauthored. The resulting clip linearly interpolates those root samples during playback.
 *
 * @evidence contracts/common.md#principled-implementation A sinusoid with the gait period supplies each baked vertical sample; gaitMotion wraps cycle time plus phase and requires finite amplitude, phase and centre before emitting the root transform, while sampleMotion linearly interpolates consecutive baked translations.
 * @evidence contracts/common.md#clear-and-simple-design Three scalar parameters describe height offset, magnitude and cycle offset, reusing the enclosing gait's period instead of introducing a separate root clock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Bobbing uses the same formula for every rig and gait, without a creature-name preset or hidden horizontal displacement; omission emits no root transform rather than guessed movement.
 * @evidence contracts/common.md#meaningful-documentation States the evaluated sinusoid, local-Y metre displacement, dimensionless phase, identity rotation and scale, finite inputs and omission's unauthored-root meaning.
 * @author Samchon
 */
export interface IAutoMovieGaitRootBob {
  /** Finite signed peak displacement from center, in metres. */
  amplitude: number;

  /** Finite cycle offset in turns; normalized modulo one during synthesis. */
  phase: number;

  /** Finite neutral vertical translation, in metres. */
  center: number;
}
