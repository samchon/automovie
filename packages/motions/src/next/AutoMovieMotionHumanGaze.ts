import { GAZE_RECRUITS } from "../compose/GAZE_RECRUITS";
import { glance as glanceLaw } from "../compose/internal/glance";
import { lookPrimitive as lookPrimitiveLaw } from "../compose/internal/lookPrimitive";
import { HumanGaze as HumanGazeSource } from "../everyday/HumanGaze";
import { look as lookLaw } from "../everyday/internal/look";

/**
 * An overlay: where the eyes and head look. It layers on any whole-body action.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `look`: Standing and turning the eyes, head and trunk to a target, either at
 *   once or, when cued by something seen or heard, after a seeded reaction
 *   time: the orienting response of a bystander.
 * - `lookPrimitive`: The eyes and the head brought toward a target by a weight:
 *   the gaze primitive, on the head channel only.
 * - `glance`: A glance: the gaze goes to a target and comes back, its weight
 *   rising over one window and falling over another on the clock's envelope,
 *   and the head is written from the first instant to the last.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `RECRUITS`: The segments a gaze primitive may recruit, as data: the eyes
 *   alone, or the eyes and the head.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanGaze`: Gaze as a goal: the eyes' lines brought onto a target, with the
 *   eyes, the head and neck and the trunk recruited in that order as the target
 *   lies farther from where the body faces.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanGaze} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanGaze {
  /**
   * Standing and turning the eyes, head and trunk to a target, either at once
   * or, when cued by something seen or heard, after a seeded reaction time: the
   * orienting response of a bystander.
   *
   * The feet stay planted where they are (the stand law places the body), and
   * the gaze goal is the eyes' lines on the target, recruited eyes, head and
   * trunk in that order ({@link HumanGaze}); the target is tracked while the
   * action lasts. Use the gaze layer to look while doing something else; this
   * action is for a gaze that is the whole performance or that must turn the
   * trunk.
   *
   * An uncued look at a target outside the 120 degree field the performer
   * attends ahead (60 degrees either side of the heading) is refused: nothing
   * there could have drawn the look, so the author declares the cue. A cue
   * delays the shift by a simple reaction time drawn from an ex-Gaussian, the
   * distribution simple reaction times follow (Hohle 1965, J Exp Psychol
   * 69:382): a visual cue `seen` with mu, sigma and tau of 260, 35 and 70 ms
   * for a novice to 220, 25 and 40 ms for an elite on the `reaction` axis, and
   * an acoustic `signal` 40 ms faster in mu, since simple auditory reaction is
   * faster than visual by a few tens of milliseconds (Welford 1980, Reaction
   * Times). The values are provisional: they place the mean inside the 200 to
   * 300 ms of simple visual reaction in adults, and no study located measures
   * orienting onset by skill.
   *
   * Events: `gazeOn`, when the eyes reach the target, and `settled`, when the
   * head and trunk end their turn.
   */
  export import look = lookLaw;

  /**
   * Gaze as a goal: the eyes' lines brought onto a target, with the eyes, the
   * head and neck and the trunk recruited in that order as the target lies
   * farther from where the body faces.
   *
   * Gaze shifts recruit the eyes first and the head only beyond a threshold:
   * Freedman (2008, Exp Brain Res 190:369) reviews head-unrestrained gaze
   * shifts in which the head contributes little below about 15 to 20 degrees
   * and an increasing share beyond; Hollands, Ziavra and Bronstein (2004, Exp
   * Brain Res 154:261) find that large turns recruit the eyes, head, trunk and
   * feet in that order. The split here keeps the final eye-in-head eccentricity
   * at most `EYES` (15 degrees) on each axis, gives the head and neck the
   * remainder up to `HEAD` (comfortable cervical share, the yaw after Bennett
   * et al. 2002 and the pitch provisional: 60 degrees of yaw, 40 down and 30
   * up, inside `DEFAULT_HUMANOID_ROM`), and, when the trunk may join, gives the
   * chest and lumbar spine the yaw beyond that up to `TRUNK` (40 degrees,
   * provisional, inside their combined twist range), 60 % to the chest and 40 %
   * to the spine. What none of these can hold stays on the eyes, clamped to
   * their range, so a gaze too far behind the body is visibly short; turning
   * the feet is the `look` action's step-turn.
   *
   * The head and neck angles come from the engine's `AutoMovieEngineKinematics.gazeChainJoints`, which
   * splits one aim over the neck and the head inside their ranges; the eyes are
   * then solved exactly: each eye's direction to the target is read in its
   * head's frame by forward kinematics of the trunk and head, and turned into
   * the eye's twist (yaw) and flexion (pitch), which compose as twist then
   * flexion in the default joint basis (`jointToQuaternion`), so the eye's
   * forward meets the target exactly within the eye's range.
   *
   * Timing: the eyes move on the saccadic main sequence, duration `2.2 A + 21`
   * milliseconds for an amplitude of `A` degrees (Bahill, Clark and Stark 1975,
   * Math Biosci 24:191; Carpenter 1988), and the head and trunk on a
   * minimum-jerk profile of `0.15 + 0.004 A` seconds (provisional: head
   * movements are slower than saccades and lengthen with amplitude,
   * Zangemeister and Stark 1981; the coefficients are unmeasured). Because the
   * eyes are re-solved against the moving head on every frame, they hold the
   * target while the head catches up, as the vestibulo-ocular reflex does, and
   * a moving target is pursued.
   */
  export import HumanGaze = HumanGazeSource;

  /**
   * The eyes and the head brought toward a target by a weight: the gaze
   * primitive, on the head channel only.
   *
   * The split between eyes and head and the exact solution of each eye belong
   * to {@link HumanGaze.aim}; this primitive gives it the target as a frame of
   * the action and a weight, and claims the head channel only. The trunk's
   * share of a far gaze is the trunk channel's to write, so a gaze here never
   * recruits it, and a target too far to the side stays visibly short.
   * Re-exported as `AutoMovieMotionHumanGaze.lookPrimitive`, apart from the
   * family's own `look` law.
   *
   * @param props The body, the target, the window and the weight.
   * @returns The primitive, on the head.
   */
  export const lookPrimitive: typeof lookPrimitiveLaw = lookPrimitiveLaw;

  /**
   * A glance: the gaze goes to a target and comes back, its weight rising over
   * one window and falling over another on the clock's envelope, and the head
   * is written from the first instant to the last. Re-exported as
   * `AutoMovieMotionHumanGaze.glance`.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param rise The instants the gaze leaves and arrives at.
   * @param fall The instants the gaze starts returning and is back at.
   * @param target What is looked at.
   * @param recruit Which segments may join; the head too by default.
   * @returns The primitive.
   */
  export const glance: typeof glanceLaw = glanceLaw;

  /**
   * The segments a gaze primitive may recruit, as data: the eyes alone, or the
   * eyes and the head. The trunk is not a member because the gaze primitive
   * claims the head channel only; the trunk's share of a far gaze is the trunk
   * channel's to write. Re-exported as `AutoMovieMotionHumanGaze.RECRUITS`.
   */
  export const RECRUITS: typeof GAZE_RECRUITS = GAZE_RECRUITS;
}
