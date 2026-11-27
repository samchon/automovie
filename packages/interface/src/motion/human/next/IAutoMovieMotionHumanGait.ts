import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanRun } from "../actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanCarry } from "../carrying/IAutoMovieMotionHumanCarry";
import type { IAutoMovieMotionHumanApproach } from "../everyday/IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanProxemics } from "../everyday/IAutoMovieMotionHumanProxemics";
import type { IAutoMovieMotionHumanDrillRegulation } from "../lexicon/IAutoMovieMotionHumanDrillRegulation";
import type { IAutoMovieMotionHumanPursuit } from "../lexicon/IAutoMovieMotionHumanPursuit";
import type { IAutoMovieMotionHumanTravelDoor } from "../lexicon/IAutoMovieMotionHumanTravelDoor";
import type { IAutoMovieMotionHumanGaitAided } from "./IAutoMovieMotionHumanGaitAided";
import type { IAutoMovieMotionHumanGaitStyled } from "./IAutoMovieMotionHumanGaitStyled";

/**
 * The gaits: walking and running to a floor point, travel relative to a person,
 * passing an opening and walking with a load, with the styled gaits
 * (`IAutoMovieMotionHumanGaitStyled`) and the aided walks
 * (`IAutoMovieMotionHumanGaitAided`), which run the walk's stepping plan.
 *
 * Every gait shares one speed model: a pace is a Froude number `Fr` and the
 * speed is `v = sqrt(Fr g l)` for the hip height `l` (`walk.FROUDE`,
 * `run.GAITS`): a body with a longer leg is faster by the square root of `l`,
 * its step is longer by `l` and its steps a minute fall by the square root of
 * `l`. Every speed and steps a minute stated on these types is at the reference
 * hip, 0.93 m (`walkRoot.REFERENCE_HIP`). `stride` changes the step and the
 * steps a minute inversely and leaves the speed; `manner.pace` multiplies the
 * speed (`IAutoMovieMotionManner.pace`).
 *
 * `WalkPace` and `RunPace` name the closed paces. A style that fixes more than
 * the pace is a preset, data spread into `walk`'s parameters beside the
 * destination: `AutoMovieMotionHumanGait.STROLL`, `HURRY` and `TRUDGE`
 * (`IStridePreset`) and `SWAGGER` (`ICarriagePreset`); a preset adds no method.
 * The approach has presets too: `FOLLOW` and `ESCORT`
 * (`ITrackingApproachPreset`) and `CONFRONT` (`IFacingApproachPreset`). A jog
 * and a sprint fix only the run's pace, so they are `pace: "jog"` and `pace:
 * "sprint"`, with no preset.
 *
 * Every method appends its action to the chain and returns the chain. Its
 * `anchor` is the action's id, unique in the composition, which another action
 * syncs to (`sync({ of })`) or is cut on (`until({ of, event })`).
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanGait` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanGait<Chain>
  extends
    IAutoMovieMotionHumanGaitStyled<Chain>,
    IAutoMovieMotionHumanGaitAided<Chain> {
  /**
   * Walk in whole steps through `via` to `to` and stop with the feet side by
   * side, facing `face` or along the last leg. The pace fixes the speed by the
   * family's speed model, and no step is longer than the pace allows, so the
   * step count rounds up.
   *
   * @param params The destination, way, pace, Effort scales, manner, formation
   *   slot, beat and moving support.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the walk appended.
   */
  walk(params: IAutoMovieMotionHumanWalkParams, anchor?: string): Chain;

  /**
   * Run through `via` to `to` at a jog, a run or a sprint, both feet leaving
   * the floor once a step, and stop at `to`, facing `face` or along the last
   * leg. The pace fixes the speed and the share of each stride a foot is down
   * (`IAutoMovieMotionHumanRun`).
   *
   * @param params The destination, way, pace, Effort scales and manner.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the run appended.
   */
  run(params: IAutoMovieMotionHumanRun.IParams, anchor?: string): Chain;

  /**
   * Walk straight at a person, a prop or a point and stop facing it, the front
   * of the chest `at` short of it: a proxemic band or metres. The target is
   * read where it is at the start, or followed to where a person comes to rest
   * (`track`). An approach always walks; a charge is a `run`.
   *
   * @param params The target, gap, side, pace, movement quality, manner, people
   *   to walk round and tracking.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the approach appended.
   */
  approach(
    params: IAutoMovieMotionHumanApproach.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Walk to `to` with a load in one hand, a box in both, a child on the hip, or
   * a cart pushed by its handle, and stop holding it. The loaded arms stop
   * swinging, a held load slows the walk and leans the trunk by its mass, and
   * the steps are the walk's.
   *
   * Registered law: `registered("carryLoad", params)`; not a chain method.
   *
   * @param params The destination, the hold, the loaded side, the load's mass
   *   share, the pace and the manner.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the carry appended.
   */
  carryLoad(params: IAutoMovieMotionHumanCarry.IParams, anchor?: string): Chain;

  /**
   * Run straight to where a moving person will be when the runner gets there
   * and stop at arm's length of that place, facing it. The person is read from
   * their placed actions, so they are composed first; a pace that does not
   * close on them is refused.
   *
   * Registered law: `registered("intercept", params)`; not a chain method.
   *
   * @param params The person headed off and the run's pace.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the interception appended.
   */
  intercept(
    params: IAutoMovieMotionHumanPursuit.IIntercept,
    anchor?: string,
  ): Chain;

  /**
   * Run straight away from a person, read where they are when the flight
   * begins, for `metres` and stop there facing away.
   *
   * Registered law: `registered("flee", params)`; not a chain method.
   *
   * @param params The person fled from, the distance and the run's pace.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the flight appended.
   */
  flee(params: IAutoMovieMotionHumanPursuit.IFlee, anchor?: string): Chain;

  /**
   * Square up on a named opening of an obstacle, pass through its middle
   * upright, ducking, side-on or crawling prone, and stop one step beyond it.
   * An opening narrower or lower than the posed body is refused with the
   * measure it needs; a crawl is entered prone.
   *
   * Registered law: `registered("travelDoor", params)`; not a chain method.
   *
   * @param params The obstacle, its opening, the posture and the walk's pace.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the passage appended.
   */
  travelDoor(
    params: IAutoMovieMotionHumanTravelDoor.IParams,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the Gait methods. */
/**
 * The parameters of the styled gaits: named ways of going somewhere on foot,
 * whose destination the composition gives. The speed model and the walk presets
 * (`stroll`, `hurry`, `trudge`, `swagger`) are on the Gait family
 * (`IAutoMovieMotionHumanGait<Chain>`, above).
 *
 * A styled gait has a speed no pace has. It runs the walk's stepping plan in a
 * gait of its own, as the run does, and counts as a walk wherever actions are
 * told apart by kind:
 *
 * - `march` keeps the drill regulation's cadence and step, 120 steps a minute and
 *   30 inches (0.762 m) in quick time, the same step for every marcher (US Army
 *   TC 3-21.5). The cadence governs: the way is covered in the whole number of
 *   steps nearest it in drill steps, so over a way that is not a whole number
 *   of them the step gives and the cadence stays.
 * - `doubleTime` keeps 180 steps a minute on the same step, which is a jog's
 *   speed, so it is run in the jog's gait with the count kept.
 * - `prowl` is the sneak on deeply bent knees; `sad` and `proud` carry a mood in
 *   speed, arm swing and trunk; `limp` spares one leg, standing on it briefly;
 *   `drunk` is slow, unsteady in time and wanders off its line. All
 *   provisional, each constant saying what was read and what was not.
 * - `sneak` goes slower than the slow walk on shorter steps, with the pelvis
 *   lowered and the arms held close (provisional values; no study of stealthy
 *   gait has been read).
 */
export namespace IAutoMovieMotionHumanGait {
  /**
   * The closed paces of the walk, `slow`, `normal` and `fast`, each a Froude
   * number of the speed model (`walk.FROUDE`). Each pace's speed and steps a
   * minute are on `IAutoMovieMotionHumanWalkParams.pace`.
   */
  export type WalkPace = "slow" | "normal" | "fast";

  /**
   * The closed paces of the run, `jog`, `run` and `sprint`, each a duty factor
   * and a Froude number of the speed model (`run.GAITS`). Each pace's speed and
   * steps a minute are on `IAutoMovieMotionHumanRun.IParams.pace`.
   */
  export type RunPace = "jog" | "run" | "sprint";

  /**
   * A walk preset that fixes the pace, the step-length scale and the arm-swing
   * scale: the stroll, the hurry and the trudge. Spread into `walk`'s
   * parameters with the destination; each value means what the walk's member of
   * the same name does.
   */
  export interface IStridePreset {
    /** The walk's pace. */
    pace: WalkPace;

    /**
     * The step-length scale, in [0.6, 1.3], as
     * `IAutoMovieMotionHumanWalkParams.stride`.
     */
    stride: number;

    /**
     * The arm-swing scale, in [0, 2], as
     * `IAutoMovieMotionHumanWalkParams.armSwing`.
     */
    armSwing: number;
  }

  /**
   * A walk preset that fixes the pace, the arm-swing scale and the elbows'
   * spread: the swagger. Spread into `walk`'s parameters with the destination;
   * each value means what the walk's member of the same name does.
   */
  export interface ICarriagePreset {
    /** The walk's pace. */
    pace: WalkPace;

    /**
     * The arm-swing scale, in [0, 2], as
     * `IAutoMovieMotionHumanWalkParams.armSwing`.
     */
    armSwing: number;

    /**
     * The elbows held out from the body, degrees in [0, 30], as
     * `IAutoMovieMotionHumanWalkParams.elbows`.
     */
    elbows: number;
  }

  /**
   * The side of a person an approach comes to: `front`, `left`, `right` or
   * `behind`, as `IAutoMovieMotionHumanApproach.IParams.from`.
   */
  export type ApproachSide = "front" | "left" | "right" | "behind";

  /**
   * Whether an approach follows a person where they go: `true` stops at the
   * place they come to rest, `"pace"` also matches their speed on the way, and
   * `false` reads them once where they are when it begins; as
   * `IAutoMovieMotionHumanApproach.IParams.track`, whose result is stated
   * there.
   */
  export type ApproachTrack = boolean | "pace";

  /**
   * An approach preset that fixes the side, the distance and whether the walk
   * tracks the person: the follow and the escort. Spread into `approach`'s
   * parameters with the person; each value means what the approach's member of
   * the same name does.
   */
  export interface ITrackingApproachPreset {
    /** The side of the person the walker comes to. */
    from: ApproachSide;

    /**
     * The distance the walker stops at: a proxemic band of
     * `IAutoMovieMotionHumanProxemics`.
     */
    at: IAutoMovieMotionHumanProxemics.Band;

    /** Whether, and how, the walker keeps up with the person while they move. */
    track: ApproachTrack;
  }

  /**
   * An approach preset that fixes the side and the distance: the confrontation.
   * Spread into `approach`'s parameters with the person; each value means what
   * the approach's member of the same name does.
   */
  export interface IFacingApproachPreset {
    /** The side of the person the walker comes to. */
    from: ApproachSide;

    /**
     * The distance the walker stops at: a proxemic band of
     * `IAutoMovieMotionHumanProxemics`.
     */
    at: IAutoMovieMotionHumanProxemics.Band;
  }

  /**
   * What a styled gait leaves to the composition: the walk's destination,
   * waypoints, arrival heading and elbows.
   */
  export type IParams = Omit<
    IAutoMovieMotionHumanWalkParams,
    "pace" | "stride" | "armSwing"
  >;

  /**
   * What a march leaves to the composition: the walk's, and the regulation and
   * time it marches at.
   */
  export interface IMarch extends IAutoMovieMotionHumanGait.IParams {
    /**
     * The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time
     * (`MARCH`) when absent.
     */
    regulation?: IAutoMovieMotionHumanDrillRegulation.Name;

    /**
     * The regulation's time by its own name (`ordinary`, `quick`...); its first
     * time when absent.
     */
    time?: string;
  }

  /** What a limp leaves to the composition: the walk's, and the leg spared. */
  export interface ILimp extends IAutoMovieMotionHumanGait.IParams {
    /** The leg spared; the right when absent. */
    side?: AutoMovieHumanSide;
  }
}
