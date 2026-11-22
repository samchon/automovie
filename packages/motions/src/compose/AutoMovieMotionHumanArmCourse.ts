import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryContactContinuation } from "../posture/HumanArmTrajectoryContactContinuation";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";

/**
 * An arm group's action laid without trajectory optimisation: kept when it
 * meets every bound a solved trajectory meets
 * (`HumanArmTrajectory.admitted`), else the optimiser's seed
 * (`HumanArmTrajectory.solve`).
 *
 * On the frame grid of the span (and its `ready` and `relax`):
 *
 * - the hold: every arm's goal at the instant, each arm fitted alone on the
 *   base the planner already solved (`resolveHumanPosture.limbSeeded`), the
 *   riding arm after the one it rides, on the pose that one placed, each
 *   instant after the first continuing the swivel, the branch and the arms
 *   the instant before chose (`IAutoMovieSwivelNear`), the per-frame
 *   coherence a game's IK keeps;
 * - the reach and the return: laid by the trajectory's own reader between
 *   the rest and the hold's arms, a blend in the optimiser's coordinates
 *   timed under the audit's speed bound (`HumanArmTrajectory.admitted`
 *   states it), which is what the optimiser's own solutions of a daily
 *   reach are, the clearance they add aside.
 *
 * Timing is the law's span: a course the span is too short for is not
 * admitted and goes to the optimiser, whose refusal names the time needed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the instants, the hold's fits, who lays the transports, the admission and the fallback.
 * @evidence contracts/development/design.md#principled-representation The course is the arms' clinical triples at the hold's instants, read through the same playback as a solved trajectory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One input record and one function, read by `AutoMovieMotionHumanArmPlanned.planned`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No bound is the course's own: the admission is the trajectory model's reading.
 */
export namespace AutoMovieMotionHumanArmCourse {
  /**
   * What the planner lends the course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and owner.
   * @evidence contracts/development/design.md#principled-representation The planner's own readers of one group over one span.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members the course reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reader is the planner's, so the course and the optimiser read one problem.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The span's instants, seconds. */
    span: { start: number; ready: number; relax: number; end: number };

    /** The current duration divided by the law's original duration, for an explicit replan. */
    tempo?: number;

    /** Each arm's side, rest, return and the bone of another arm its grip rides, in the group's order. */
    arms: readonly {
      side: "left" | "right";
      rest: IAutoMovieMotionHumanArmAngles.IAngles;
      back?: IAutoMovieMotionHumanArmAngles.IAngles;
      on?: string;
    }[];

    /**
     * The posture so far and its pose with the group's arms left out, at an instant.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; the caller of `course`, which implements it, carries this claim.
     */
    at: (seconds: number) => { posture: IAutoMovieMotionHumanPosture; pose: IAutoMoviePose };

    /**
     * An arm's goal at an instant, as the plan perceives it.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; the caller of `course`, which implements it, carries this claim.
     */
    aimed: (arm: number, seconds: number) => IAutoMovieHumanLimbGoal;

    /**
     * The trajectory problem on given waypoints, the optimiser's own.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States when the member is called and what it gives.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A member's signature; the caller of `course`, which implements it, carries this claim.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A member's signature; the caller of `course`, which implements it, carries this claim.
     */
    problem: (times: readonly number[]) => HumanArmTrajectory.IProblem;

    /** The plan's exact FK reader. */
    resolution: ReturnType<typeof prepareHumanPoseResolution>;
  }

  /**
   * The group's course: its trajectories and whether the model admits them;
   * none when the span holds no instant on the hold.
   *
   * @param props The planner's readers.
   * @param inheritedPace The original coupled speed limits for a separate trial of one member.
   * @returns The trajectories in the group's order and the admission; none without a hold instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instants, the phases, the result and when there is none.
   * @evidence contracts/development/implementation.md#principled-implementation The hold is the rig's analytic two-bone fit per instant, continued from the instant before; the transports are the trajectory reader's blend, and the whole is admitted by the trajectory model's own feasibility reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The instants, held poses and original model admission, followed by a local contact-branch continuation for a refused hold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is admitted that the model refuses; a refused course only seeds the optimiser, every requirement intact.
   * @evidence contracts/development/implementation.md#efficient-algorithms One two-bone limb fit per arm per hold instant on the planner's solved base (a golden refinement about the last instant's swivel after the first, no posture solve), no fit on a transport instant, then one model evaluation, in place of the optimiser's penalty rounds of convexified programmes and its sampling planner. Unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the planner's cached postures, bases and goals, and the trajectory's playback.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Per-instant arms live until the admission; the readers returned keep only the trajectory's playback data.
   */
  export function course(
    props: IProps,
    inheritedPace?: (seconds: number) => number,
  ): ReturnType<typeof HumanArmTrajectory.admitted> | undefined {
    const { span, arms } = props;

    // Each phrase (the reach, the hold, the return) cut into equal pieces no
    // longer than a frame, its end left to the next: the hold's two ends are
    // instants of the grid themselves. Laid beside a span-wide grid instead,
    // an end falls milliseconds from a grid instant, and the arm's frame of
    // travel between the two reads as a speed of tens of metres a second.
    const times: number[] = [];
    for (const [from, to] of [
      [span.start, span.ready],
      [span.ready, span.relax],
      [span.relax, span.end],
    ] as const) {
      if (!(to > from + 1e-9)) continue;
      const pieces: number = Math.max(
        1,
        Math.ceil((to - from) / AutoMovieMotionHumanArmCourse.STEP - 1e-9),
      );
      for (let j: number = 0; j < pieces; ++j)
        times.push(from + ((to - from) * j) / pieces);
    }
    times.push(span.end);
    const holding: (t: number) => boolean = (t: number): boolean =>
      t >= span.ready - 1e-9 && t <= span.relax + 1e-9;
    const course: Map<number, IAutoMovieMotionHumanArmClearance.IArm[]> = new Map();
    const fit: ReturnType<typeof solver> = solver(props);

    if (!times.some(holding)) return undefined;

    // One chain of fits over the hold, each instant continuing the swivel,
    // the branch and the arms the one before chose, so the elbow never
    // changes its side between two frames; the reach and the return are the
    // reader's to lay between the rest and these.
    //
    // Consecutive identical poses and complete goals hold their last fit.
    // The full frame-grid admission still checks every displayed instant.
    const problem: HumanArmTrajectory.IProblem = props.problem(times);
    const held: number[] = [];
    times.forEach((t: number, k: number): void => {
      if (holding(t)) held.push(k);
    });
    let previousPose: IAutoMoviePose | undefined;
    let previousGoals: readonly IAutoMovieHumanLimbGoal[] | undefined;
    let near: IAutoMovieMotionHumanResolveHumanPosture.INear = {};
    let before: IAutoMovieMotionHumanArmClearance.IArm[] | undefined;
    for (const k of held) {
      const t: number = times[k]!;
      const pose: IAutoMoviePose = problem.bases[k]!.pose;
      const goals: IAutoMovieHumanLimbGoal[] = arms.map(
        (_: IProps["arms"][number], a: number): IAutoMovieHumanLimbGoal =>
          props.aimed(a, t),
      );
      if (before !== undefined && same(pose, previousPose) && same(goals, previousGoals)) {
        course.set(t, before);
        continue;
      }
      const solved: ReturnType<typeof fit> = fit(t, goals, near, before);
      previousPose = pose;
      previousGoals = goals;
      course.set(t, solved.arms);
      near = solved.near;
      before = solved.arms;
    }
    const read: ReturnType<typeof HumanArmTrajectory.admitted> =
      HumanArmTrajectory.admitted(
        problem,
        arms.map(
          (
            _: IProps["arms"][number],
            a: number,
          ): (IAutoMovieMotionHumanArmClearance.IArm | undefined)[] =>
            times.map(
              (t: number): IAutoMovieMotionHumanArmClearance.IArm | undefined =>
                course.get(t)?.[a],
            ),
        ),
        props.tempo,
        inheritedPace,
      );
    return HumanArmTrajectoryContactContinuation(problem, held, read, props.tempo);
  }

  /**
   * The frame grid, seconds: the finest the optimiser's waypoints are spaced
   * (`HumanArmTrajectory`), the course's instants and the grid a law's arm
   * chain continues on (`AutoMovieMotionHumanArmChain`): the optimiser's own
   * waypoint spacing, not a value of its own.
   */
  export const STEP: number = 1 / 30;
}

/**
 * Whether two plain records hold the same values, member by member: numbers
 * and other primitives by `Object.is`, arrays by length and order, records
 * by their own keys; anything else by identity.
 */
function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v: unknown, i: number): boolean => same(v, b[i]))
    );
  if (
    Object.getPrototypeOf(a) !== Object.prototype ||
    Object.getPrototypeOf(b) !== Object.prototype
  )
    return false;
  const left: [string, unknown][] = Object.entries(a);
  const right: Map<string, unknown> = new Map(Object.entries(b));
  return (
    left.length === right.size &&
    left.every(
      ([key, value]: [string, unknown]): boolean =>
        right.has(key) && same(value, right.get(key)),
    )
  );
}

/** The posture solve of every arm's goal at an instant, continued from the seeds the last instant chose. */
function solver(
  props: AutoMovieMotionHumanArmCourse.IProps,
): (
  t: number,
  goals: readonly IAutoMovieHumanLimbGoal[],
  near: IAutoMovieMotionHumanResolveHumanPosture.INear,
  before?: readonly IAutoMovieMotionHumanArmClearance.IArm[],
) => { arms: IAutoMovieMotionHumanArmClearance.IArm[]; near: IAutoMovieMotionHumanResolveHumanPosture.INear } {
  // An arm that rides another is fitted after it, on the pose it placed.
  const order: number[] = props.arms
    .map(
      (
        _: AutoMovieMotionHumanArmCourse.IProps["arms"][number],
        a: number,
      ): number => a,
    )
    .sort(
      (p: number, q: number): number =>
        Number(props.arms[p]!.on !== undefined) -
          Number(props.arms[q]!.on !== undefined) || p - q,
    );
  return (
    t: number,
    goals: readonly IAutoMovieHumanLimbGoal[],
    near: IAutoMovieMotionHumanResolveHumanPosture.INear,
    before?: readonly IAutoMovieMotionHumanArmClearance.IArm[],
  ): { arms: IAutoMovieMotionHumanArmClearance.IArm[]; near: IAutoMovieMotionHumanResolveHumanPosture.INear } => {
    // Each arm alone on the base the planner already solved, the rest of
    // the body as it stands: one two-bone fit per arm, no posture solve.
    // The base holds the planned arms at rest, and a fit reads the pose it
    // is given for what it continues: the forearm's twist has two solutions
    // and takes the one nearer the pose's own (`solveDistalTwist`), the
    // wrist the one nearer its held angles. Fitted on the resting arm, each
    // instant chose alone and consecutive instants took different solutions
    // (a forearm twist of +41 then -41 degrees at one hand place). So the
    // arms the instant before are posed in first, and the fit continues
    // them.
    let pose: IAutoMoviePose = props.at(t).pose;
    if (before !== undefined)
      props.arms.forEach(
        (
          arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number],
          a: number,
        ): void => {
          pose = HumanArmClearance.posed(pose, arm.side, before[a]!);
        },
      );
    const next: Partial<
      Record<
        AutoMovieHumanLimb,
        NonNullable<IAutoMovieMotionHumanResolveHumanPosture.INear[AutoMovieHumanLimb]>
      >
    > = {};
    for (const a of order) {
      const limb: AutoMovieHumanLimb = `${props.arms[a]!.side}Arm`;
      const fitted: ReturnType<typeof resolveHumanPosture.limbSeeded> =
        resolveHumanPosture.limbSeeded(
          props.body,
          pose,
          limb,
          goals[a]!,
          near[limb],
          props.resolution,
        );
      pose = fitted.pose;

      // Refined to the cold sweep's own resolution, so a continued fit
      // resolves its swivel as finely as a cold one.
      // A fit that names no seed (another candidate won) leaves the last one,
      // so the next instant still continues rather than sweeping afresh.
      if (fitted.seed !== undefined && fitted.seed !== null)
        next[limb] = { ...fitted.seed, tolerance: hingedArmSwivel.RESOLUTION };
      else if (near[limb] !== undefined) next[limb] = near[limb]!;
    }
    return {
      arms: props.arms.map(
        (
          arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number],
        ): IAutoMovieMotionHumanArmClearance.IArm =>
          AutoMovieMotionHumanArmAngles.angles(pose, arm.side),
      ),
      near: next,
    };
  };
}
