import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePose } from "../pose/IAutoMoviePose";
import { IAutoMovieBeatEndFootPlant } from "./IAutoMovieBeatEndFootPlant";
import { IAutoMovieMountBinding } from "./IAutoMovieMountBinding";

/**
 * One actor's resolved state at the end of a compiled beat.
 *
 * `transform` is the actor's world-space root with any sampled pose root folded
 * in. `pose` keeps only the final articulation; its root is cleared to avoid
 * double-applying the same displacement when a later beat uses this as its
 * starting state.
 *
 * Beyond the end pose, the state carries what a _resumable_ simulation needs so
 * the next beat continues instead of resetting: the gait cycle phase, the root
 * velocity, the planted feet, and the persistent mount coupling. Each is `null`
 * when it does not apply, so a static prop and a mid-stride walker share one
 * shape.
 *
 * @evidence contracts/common.md#principled-implementation A snapshot sampled at the shot end by `resolveBeatEnd`: the transform folds the sampled pose root into the staged placement or takes a baked object clip, velocity is a trailing one-frame finite difference, and plants come from `plantsAtEnd` over the ground-IK output.
 * @evidence contracts/common.md#clear-and-simple-design Static and moving actors share one shape with `null` for absent resumable facts, so the next beat's opening and the continuity linter compare fields without branching on the kind of actor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor kind is special-cased; the pose root is cleared on purpose so the folded displacement is not applied twice, and a non-looping clip sampled after its end reports zero velocity as its documented hold.
 * @evidence contracts/common.md#meaningful-documentation States the world frame of transform, facing and velocity, why the pose root is cleared, the `null` meaning of each optional field, where the phase comes from, the velocity window, baked-clip overrides, and plant ordering.
 * @author Samchon
 */
export interface IAutoMovieBeatEndActorState {
  /** Scene node / cast id of the actor. */
  node: string;

  /**
   * Final world-space root transform after the beat. When a baked object clip
   * drives the node (an `attachTo` child, a mounted rider, a launched
   * projectile), that clip's transform at the beat end replaces the staged
   * placement.
   */
  transform: IAutoMovieTransform;

  /** Actor forward (`+z`) direction in world space, rotated by `transform`. */
  facing: IAutoMovieVector3;

  /** Final articulation, or `null` when the actor ends in rest pose. */
  pose: IAutoMoviePose | null;

  /** Motion clip sampled for this state, or `null` for a held/static actor. */
  motion: string | null;

  /**
   * Seconds sampled within `motion`, or the shot duration for static actors.
   */
  localTime: number;

  /**
   * Seconds into the gait cycle at beat end, or `null` for a held actor or a
   * clip that neither loops nor carries a `gaitCycle`. A carried `gaitCycle` is
   * authoritative, which is how the arranged, non-looping performance clip
   * still reports its stride phase; otherwise it is `localTime` wrapped by the
   * looping clip's duration. The next beat resumes the gait mid-stride at this
   * phase instead of resetting to the cycle start: the difference between a
   * continuous walk and a stutter at every cut.
   */
  gaitPhase: number | null;

  /**
   * World-space root velocity at beat end in m/s, finite-differenced over the
   * trailing 1/24 s of the clip, or `null` for a held/static actor that no
   * baked object clip drives. At the exact clip end this is the incoming
   * left-hand velocity at the cut; a non-looping clip sampled strictly after
   * its end holds its last pose at zero velocity. A node driven by a baked
   * object clip reports that clip's trailing velocity, even while it holds its
   * own pose.
   */
  rootVelocity: IAutoMovieVector3 | null;

  /**
   * The most recent stance plant per foot whose inclusive run contains the beat
   * end (from the ground-IK pass), or `null` when no plant is active at that
   * instant. Ordered by each foot's first active plant in the pass output.
   */
  footPlants: IAutoMovieBeatEndFootPlant[] | null;

  /**
   * The persistent coupling this actor rides (a rider on a horse's saddle
   * bone), or `null` when unmounted. Carried rider-side (one rider rides
   * exactly one parent while a parent may carry many riders), so the next beat
   * re-couples without staging having to re-declare it.
   */
  mount: IAutoMovieMountBinding | null;
}
