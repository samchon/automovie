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
 * The state also carries gait phase, estimated root velocity, stance targets and persistent mount. These are resumption inputs, not proof of physically continuous motion: the reference synthesizer resumes horizontal speed magnitude, retaining authored speed at or below 1e-6 m/s, and the sampled ground-IK solve can retain contact residual. Each absent fact is `null`, allowing static props and walkers to share the shape.
 *
 * @evidence contracts/common.md#principled-implementation `resolveBeatSnapshot` samples the motions the shot actually plays, folds the pose root through the staged transform with `foldRoot` or takes a baked object clip's transform, rotates `+z` by the result for `facing`, and derives phase, velocity and plants with `gaitPhaseOf`, `rootVelocityOf` and `plantsAtEnd`.
 * @evidence contracts/common.md#clear-and-simple-design One record per scene node holds the placement, the articulation and the four resumable facts, with `null` for an inapplicable fact rather than separate record shapes for props, walkers and riders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The state is measured from the compiled shot rather than copied from the authored program, so a prop left in a hand ends where the baked clip put it; the pose root is cleared instead of being applied a second time by the next beat.
 * @evidence contracts/common.md#meaningful-documentation States the two producers and instants, the root folding and clearing, and the null convention; members give each value's frame, unit, sampling rule and window, and when each is null.
 */
export interface IAutoMovieBeatEndActorState {
  /** Scene node and cast id of the actor. */
  node: string;

  /**
   * World-space root transform at the instant. Active baked translation and rotation channels together replace the folded staged placement; scale then comes from the active scale channel or unit scale. Translation alone does not establish this override. A null pose root can leave the staged transform borrowed.
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
   * Seconds into the gait cycle, in `[0, period)`, or `null` without motion or a cycle. A carried `gaitCycle` is authoritative, including on arranged non-looping clips, but an invalid period or nonfinite phase yields null; without it, a positive-duration looping clip wraps `localTime` by duration. The reference synthesizer uses this phase to resume a gait rather than restarting its cycle.
   */
  gaitPhase: number | null;

  /**
   * World-space root velocity in m/s, a backward difference over the trailing 1/24 s window clamped at clip start, or `null` without motion or baked authority. A looping pose clip's window never crosses its seam and measures the unlooped closing stretch exactly at the seam; a non-looping clip sampled after its end yields zero. A baked node uses shot-local channel authority at the two endpoints, which may span a handoff; it yields zero at the opening or when the earlier endpoint has no translation. These are finite-difference estimates, not instantaneous derivatives or conserved momentum.
   */
  rootVelocity: IAutoMovieVector3 | null;

  /**
   * At most one stance plant per foot whose inclusive run contains `localTime`, the latest-starting one when runs overlap with a later entry winning equal-start ties, or `null` without held plants. Ordered by each foot's first held plant in the pass output. Selection uses `localTime`, although the performer emits shot-local intervals: its normal zero start offset aligns the clocks, while a supplied nonzero offset shifts selection. Selected plant objects are borrowed.
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
