import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanEntryState } from "../law/IAutoMovieMotionHumanEntryState";
import type { IAutoMovieMotionHumanWalkFacing } from "./IAutoMovieMotionHumanWalkFacing";
import type { IAutoMovieMotionHumanWalkFoot } from "./IAutoMovieMotionHumanWalkFoot";
import type { IAutoMovieMotionHumanWalkGait } from "./IAutoMovieMotionHumanWalkGait";
import type { IAutoMovieMotionHumanWalkPace } from "./IAutoMovieMotionHumanWalkPace";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * The footstep plan of a walk: footprints, their heel-strike and toe-off
 * times, each foot's scheduled stance, and the pelvis path, all as closed
 * functions of seconds.
 *
 * Footprints lie along the path from the feet's midpoint through the `via`
 * points to the destination, at least two steps whenever there is a way to
 * go. Each lies where the pelvis is `front` step periods after its heel
 * strike, so the footprints are one even step, at most `longest`, apart in
 * full stride and closer while the pelvis gathers and sheds its speed, and no
 * landing is further ahead of the pelvis than in full stride. Each is turned
 * to the path's heading averaged over one step so a corner is taken over a
 * step, alternately half a step width to either side (step width 0.1 hip
 * heights, about 9 cm, inside the 7 to 12 cm of normal adult gait, Perry and
 * Burnfield; a run passes its swing share, mid-swing lift and vertical
 * oscillation), the foot behind stepping first and the last two ending at
 * the body's rest separation, facing `face` when given: the two footfalls
 * before the closing pair turn a third and two thirds of the way, a stepping
 * turn, and the closing pair faces the arrival. A walk setting off away from
 * the way it faces turns about over its first footfalls, each foot turning
 * no more per swing than in a standing turn, and a footprint leans its leg
 * no further than the ankle holds (`walkHeading`). The pelvis's heading
 * follows the footprints (`WalkTurn`): at each heel strike it faces midway
 * between the two feet it stands on, so no foot needs more hip rotation than
 * the hip's range.
 * `WalkPace` owns the timing: each step's heel strike comes one step period
 * after the previous; its toe-off one swing (0.8 step periods, 40 % of a
 * stride) before its heel strike; the first toe-off comes after the gait's
 * initiation. `walkFoot` owns the rockers of each stance, toes-down by up to
 * 55° at toe-off.
 *
 * With `facing` (`IAutoMovieMotionHumanWalkFacing.IFacing`), the footprints and the pelvis face it
 * while the footprints still lie along the path: a walk backward, aside or
 * round a target, the side offset taken across the facing.
 *
 * The plan's root is the unconstrained pelvis path; `walkReach` then makes
 * every foot goal reachable on the actual pelvis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: The destination floor point, world metres. via: Floor points passed in order before the destination, world metres. face: The heading at arrival, degrees; the last leg's direction when absent.
 * @evidence contracts/development/design.md#principled-representation to: The destination floor point, world metres. via: Floor points passed in order before the destination, world metres. face: The heading at arrival, degrees; the last leg's direction when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkSteps.ts (walkSteps.plan, return); actions/walkWindows.ts (walkWindows.of, steps); actions/walkSteps.ts (walkSteps.plan, input); actions/walk.ts (walk.locomote).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkPace.IProps, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanEntryState, IAutoMovieVector3, IAutoMovieMotionHumanWalkFacing.IFacing identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWalkSteps {
  /**
   * Planner input; a way set from outside (`travel`) is handed to the timing as it is.
   *
   * @evidence contracts/development/common.md#meaningful-documentation to: The destination floor point, world metres. via: Floor points passed in order before the destination, world metres. face: The heading at arrival, degrees; the last leg's direction when absent.
   * @evidence contracts/development/design.md#principled-representation to: The destination floor point, world metres. via: Floor points passed in order before the destination, world metres. face: The heading at arrival, degrees; the last leg's direction when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkSteps.ts (walkSteps.plan, input).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkPace.IProps, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanEntryState, IAutoMovieVector3, IAutoMovieMotionHumanWalkFacing.IFacing identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IInput extends Pick<
    IAutoMovieMotionHumanWalkPace.IProps,
    "travel"
  > {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The state the walk starts from. */
    entry: IAutoMovieMotionHumanEntryState;

    /** The destination floor point, world metres. */
    to: IAutoMovieVector3;

    /** Floor points passed in order before the destination, world metres. */
    via?: readonly IAutoMovieVector3[];

    /** The heading at arrival, degrees; the last leg's direction when absent. */
    face?: number;

    /** Which way the body faces while it walks; along the path when absent. */
    facing?: IAutoMovieMotionHumanWalkFacing.IFacing;

    /** Walking speed, m/s. */
    speed: number;

    /** The longest step, metres. */
    longest: number;

    /** The realised step period for a planned one, seconds (timing variability). */
    period(seconds: number): number;

    /** Swing duration in step periods; 0.8 (a walk's 40 % of the stride) when absent, above 1 for a run's flight. */
    swing?: number;

    /** What the plan reads of the gait beyond its timing: its vertical oscillation in hip heights (the mean drop and the amplitude, lowest at mid-stance; a walk's when absent) and how far it holds the heels off the floor, degrees (flat when absent). */
    gait?: Pick<IAutoMovieMotionHumanWalkGait, "bob" | "heels" | "stiff">;
  }

  /**
   * Plan the footsteps of a walk. The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds. events: Named instants in seconds. stances: Stance spans per foot, seconds.
   * @evidence contracts/development/design.md#principled-representation duration: Seconds. events: Named instants in seconds. stances: Stance spans per foot, seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkSteps.ts (walkSteps.plan, return); actions/walkWindows.ts (walkWindows.of, steps); actions/walk.ts (walk.locomote).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanWalkFoot.IScheduled identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlan {
    /** Seconds. */
    duration: number;

    /** Named instants in seconds. */
    events: {
      /** Event label used to synchronise this step with other actions. */
      name: string;
      /** Event instant in action-local seconds. */
      seconds: number;
    }[];

    /** Stance spans per foot, seconds. */
    stances: {
      /** Foot kept planted throughout this stance interval. */
      side: "left" | "right";
      /** Stance beginning in action-local seconds. */
      from: number;
      /** Stance ending in action-local seconds. */
      to: number;
    }[];

    /** The rig origin before `reach`, world metres. */
    root(seconds: number): IAutoMovieVector3;

    /** The heading, degrees. */
    yaw(seconds: number): number;

    /** Stride phase: 0.25 at a left heel strike, one per stride. */
    phase(seconds: number): number;

    /** How much the body is walking, 0 standing to 1 in full stride. */
    amount(seconds: number): number;

    /** A foot's scheduled stance at an instant. */
    foot(
      side: "left" | "right",
      seconds: number,
    ): IAutoMovieMotionHumanWalkFoot.IScheduled;
  }
}
