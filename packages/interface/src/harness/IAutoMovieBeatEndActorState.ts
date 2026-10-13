import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMoviePose } from "../pose/IAutoMoviePose";
import { IAutoMovieBeatEndFootPlant } from "./IAutoMovieBeatEndFootPlant";
import { IAutoMovieMountBinding } from "./IAutoMovieMountBinding";

/**
 * One actor's resolved state at a shot-local instant of a compiled beat.
 *
 * `resolveBeatEnd` takes it at the shot end, where a later beat resumes from
 * it, and `resolveBeatOpening` takes the same shape at `t = 0` for the
 * continuity check. `transform` is the actor's world root with any sampled
 * pose root folded in, and `pose` keeps only the articulation, its root
 * cleared so a later beat starting from this state does not apply the same
 * displacement twice.
 *
 * Beyond the pose, the state carries what a resumable simulation needs so the
 * next beat continues instead of resetting: the gait phase, the root velocity,
 * the planted feet, and the persistent mount. Each is `null` when it does not
 * apply, so a static prop and a mid-stride walker share one shape.
 *
 * @evidence contracts/common.md#principled-implementation `resolveBeatSnapshot` samples the motions the shot actually plays, folds the pose root through the staged transform with `foldRoot` or takes a baked object clip's transform, rotates `+z` by the result for `facing`, and derives phase, velocity and plants with `gaitPhaseOf`, `rootVelocityOf` and `plantsAtEnd`.
 * @evidence contracts/common.md#clear-and-simple-design One record per scene node holds the placement, the articulation and the four resumable facts, with `null` for an inapplicable fact rather than separate record shapes for props, walkers and riders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The state is measured from the compiled shot rather than copied from the authored program, so a prop left in a hand ends where the baked clip put it; the pose root is cleared instead of being applied a second time by the next beat.
 * @evidence contracts/common.md#meaningful-documentation States the two producers and instants, the root folding and clearing, and the null convention; members give each value's frame, unit, sampling rule and window, and when each is null.
 * @author Samchon
 */
export interface IAutoMovieBeatEndActorState {
  /** Scene node and cast id of the actor. */
  node: string;

  /**
   * World-space root transform at the instant. When a baked object clip
   * translates the node (an `attachTo` child, a mounted rider, a launched
   * projectile), that clip's transform replaces the folded staged placement.
   */
  transform: IAutoMovieTransform;

  /** Actor forward (`+z`) direction in world space, rotated by `transform`. */
  facing: IAutoMovieVector3;

  /**
   * Articulation at the instant with its root cleared, or `null` when the
   * actor plays no motion and its scene node has no pose.
   */
  pose: IAutoMoviePose | null;

  /** Id of the motion sampled for this state, or `null` for a static actor. */
  motion: string | null;

  /**
   * Clip-local seconds sampled within `motion`: the instant minus the
   * performance's start offset, floored at zero. A static actor reports the
   * shot-local instant itself.
   */
  localTime: number;

  /**
   * Seconds into the gait cycle, in `[0, period)`, or `null` for an actor
   * without motion or a clip that neither loops nor carries a `gaitCycle`. A
   * carried `gaitCycle` is authoritative, which is how the arranged,
   * non-looping performance clip still reports its stride phase; otherwise it
   * is `localTime` wrapped by the looping clip's duration. The next beat
   * resumes the gait mid-stride at this phase instead of restarting the cycle
   * at every cut.
   */
  gaitPhase: number | null;

  /**
   * World-space root velocity in m/s, a backward difference over the trailing
   * 1/24 s window clamped at the clip start, or `null` for an actor without
   * motion that no baked object clip drives. A looping clip's window never
   * crosses its seam, and a non-looping clip sampled after its end answers
   * zero because its pose is held. A node driven by a baked object clip
   * reports that clip's trailing velocity, even while it holds its own pose.
   */
  rootVelocity: IAutoMovieVector3 | null;

  /**
   * At most one stance plant per foot whose inclusive run contains
   * `localTime`, the latest-starting one when runs overlap, or `null` when
   * none is held or no plant data was supplied. Ordered by each foot's first
   * held plant in the ground-IK pass output.
   */
  footPlants: IAutoMovieBeatEndFootPlant[] | null;

  /**
   * The persistent coupling this actor rides (a rider on a horse's saddle
   * bone), or `null` when unmounted. Carried rider-side, because one rider
   * rides exactly one parent while a parent may carry many riders, so the next
   * beat re-couples without staging having to declare it again.
   */
  mount: IAutoMovieMountBinding | null;
}
