import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanEntryState } from "../law/IAutoMovieMotionHumanEntryState";
import type { IAutoMovieMotionHumanWalkFacing } from "./IAutoMovieMotionHumanWalkFacing";
import type { IAutoMovieMotionHumanWalkFoot } from "./IAutoMovieMotionHumanWalkFoot";
import type { IAutoMovieMotionHumanWalkGait } from "./IAutoMovieMotionHumanWalkGait";
import type { IAutoMovieMotionHumanWalkPace } from "./IAutoMovieMotionHumanWalkPace";

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

    /**
     * The realised step period for a planned one, seconds (timing variability).
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkSteps.IInput.period: The realised step period for a planned one, seconds (timing variability).
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkSteps.IInput.period is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkSteps.IInput.period is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkSteps.IInput.period is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkSteps.IInput.period is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkSteps.IInput.period is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkSteps.IInput.period is used through packages/motions/src/actions/walk.ts.
     */
    period(seconds: number): number;

    /** Swing duration in step periods; 0.8 (a walk's 40 % of the stride) when absent, above 1 for a run's flight. */
    swing?: number;

    /** What the plan reads of the gait beyond its timing: its vertical oscillation in hip heights (the mean drop and the amplitude, lowest at mid-stance; a walk's when absent) and how far it holds the heels off the floor, degrees (flat when absent), its step width in hip heights (`walkSteps.WIDTH` when absent), and the share of a hip's usable twist a step of a turn in place takes (1 when absent). */
    gait?: Pick<IAutoMovieMotionHumanWalkGait, "bob" | "heels" | "stiff" | "turn" | "width">;
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

    /** Whether alternating flat footprints turn the body without travel. */
    inPlace?: boolean;

    /** Each foot's final scheduled heel strike, or negative infinity when it never swings. */
    lastLanding: Readonly<Record<AutoMovieHumanSide, number>>;

    /** Named instants in seconds. */
    events: {
      /** Event label used to synchronise this step with other actions. */
      name: string;
      /** Event instant in action-local seconds. */
      seconds: number;
    }[];

    /** Stance spans per foot, seconds. */
    stances: IStance[];

    /**
     * The rig origin before `reach`, world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkSteps.IPlan.root: The rig origin before `reach`, world metres.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkSteps.IPlan.root is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkSteps.IPlan.root is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkSteps.IPlan.root is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkSteps.IPlan.root is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkSteps.IPlan.root is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkSteps.IPlan.root is used through packages/motions/src/actions/walk.ts.
     */
    root(seconds: number): IAutoMovieVector3;

    /**
     * The heading, degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkSteps.IPlan.yaw: The heading, degrees.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkSteps.IPlan.yaw is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkSteps.IPlan.yaw is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkSteps.IPlan.yaw is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkSteps.IPlan.yaw is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkSteps.IPlan.yaw is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkSteps.IPlan.yaw is used through packages/motions/src/actions/walk.ts.
     */
    yaw(seconds: number): number;

    /**
     * Stride phase: 0.25 at a left heel strike, one per stride.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkSteps.IPlan.phase: Stride phase: 0.25 at a left heel strike, one per stride.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkSteps.IPlan.phase is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkSteps.IPlan.phase is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkSteps.IPlan.phase is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkSteps.IPlan.phase is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkSteps.IPlan.phase is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkSteps.IPlan.phase is used through packages/motions/src/actions/walk.ts.
     */
    phase(seconds: number): number;

    /**
     * How much the body is walking, 0 standing to 1 in full stride.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkSteps.IPlan.amount: How much the body is walking, 0 standing to 1 in full stride.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkSteps.IPlan.amount is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkSteps.IPlan.amount is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkSteps.IPlan.amount is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkSteps.IPlan.amount is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkSteps.IPlan.amount is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkSteps.IPlan.amount is used through packages/motions/src/actions/walk.ts.
     */
    amount(seconds: number): number;

    /**
     * A foot's scheduled stance at an instant.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanWalkSteps.IPlan.foot: A foot's scheduled stance at an instant.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWalkSteps.IPlan.foot is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWalkSteps.IPlan.foot is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWalkSteps.IPlan.foot is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWalkSteps.IPlan.foot is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWalkSteps.IPlan.foot is used through packages/motions/src/actions/walk.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWalkSteps.IPlan.foot is used through packages/motions/src/actions/walk.ts.
     */
    foot(
      side: "left" | "right",
      seconds: number,
    ): IAutoMovieMotionHumanWalkFoot.IScheduled;
  }

  /**
   * One foot's stance span in a walk's footstep plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation side: The foot kept planted. from, to: The span, action-local seconds. inPlace: Whether the footfall that begins it is taken in place at the arrival.
   * @evidence contracts/development/design.md#principled-representation One planted span of one foot, marked when its footfall only turns the body at the arrival.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkSteps.ts (walkSteps.plan, return); actions/walkLocomote.ts (the swing's reach ranges).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain seconds and a flag; the footfall's place and timing stay with walkSteps.
   */
  export interface IStance {
    /** Foot kept planted throughout this stance interval. */
    side: "left" | "right";

    /** Stance beginning in action-local seconds. */
    from: number;

    /** Stance ending in action-local seconds. */
    to: number;

    /** Whether the footfall that begins this stance is one taken in place at a turned-about or facing walk's arrival, where the swing landing in it fades its reach ranges into the landing as a turn in place does; false when absent. */
    inPlace?: boolean;
  }
}
