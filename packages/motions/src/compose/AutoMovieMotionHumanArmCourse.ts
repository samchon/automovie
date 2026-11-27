import { hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryContactContinuation } from "../posture/HumanArmTrajectoryContactContinuation";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { prepareHumanPoseResolution } from "../posture/internal/prepareHumanPoseResolution";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";

/**
 * An arm group's action laid without trajectory optimisation: kept when it
 * meets every bound a solved trajectory meets (`HumanArmTrajectory.admitted`),
 * else the optimiser's seed (`HumanArmTrajectory.solve`).
 *
 * On the frame grid of the span (and its `ready`, `relax` and knots, `grid`):
 *
 * - The hold: every arm's goal at the instant, each arm on the base the planner
 *   already solved (`HumanLimbFit.fit`), the riding arm after the one it rides,
 *   on the pose that one placed: fitted at every frame, each continuing the
 *   frame before it (`IAutoMovieSwivelNear`), the first continuing the law's
 *   own fit of its goal where the law gives its seed (`hold`), or with no reach
 *   before it the arms the course leaves from (their `rest`), so neither the
 *   branch nor the forearm's twist hops between two frames or away from the arm
 *   shown or chosen;
 * - The reach and the return: laid by the trajectory's own reader between the
 *   rest and the hold's arms, a blend in the optimiser's coordinates timed
 *   under the audit's speed bound (`HumanArmTrajectory.admitted` states it),
 *   which is what the optimiser's own solutions of a daily reach are, the
 *   clearance they add aside.
 *
 * Timing is the law's span: a course the span is too short for is not admitted
 * and goes to the optimiser, whose refusal names the time needed.
 */
export namespace AutoMovieMotionHumanArmCourse {
  /** What the planner lends the course. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The span's instants and knots, seconds. */
    span: IAutoMovieMotionHumanArmPlanned.ISpan;

    /**
     * The current duration divided by the law's original duration, for an
     * explicit replan.
     */
    tempo?: number;

    /**
     * Each arm's side, rest, return, the bone of another arm its grip rides and
     * the seed of the law's own fit of its hold's first goal, in the group's
     * order.
     */
    arms: readonly IArm[];

    /**
     * The posture so far and its pose with the group's arms left out, at an
     * instant.
     */
    at: (seconds: number) => IAt;

    /** An arm's goal at an instant, as the plan perceives it. */
    aimed: (arm: number, seconds: number) => IAutoMovieHumanLimbGoal;

    /** The trajectory problem on given waypoints, the optimiser's own. */
    problem: (times: readonly number[]) => HumanArmTrajectory.IProblem;

    /** The plan's exact FK reader. */
    resolution: ReturnType<typeof prepareHumanPoseResolution>;
  }

  /**
   * One arm of the group: its side, rest, return, the bone of another arm its
   * grip rides and the seed of the law's own fit of its hold's first goal.
   */
  export interface IArm {
    /** The arm. */
    side: AutoMovieHumanSide;

    /** The arm's angles as the course leaves. */
    rest: IAutoMovieMotionHumanArmAngles.IAngles;

    /** The arm's angles the course returns to; the rest when absent. */
    back?: IAutoMovieMotionHumanArmAngles.IAngles;

    /** The bone of another arm of the group whose grip this one rides. */
    on?: string;

    /** The seed of the law's own fit of the hold's first goal. */
    hold?: IAutoMovieSwivelSeed;
  }

  /** The posture so far at an instant and its pose without the group's arms. */
  export interface IAt {
    /** The posture so far. */
    posture: IAutoMovieMotionHumanPosture;

    /** Its pose with the group's arms left out. */
    pose: IAutoMoviePose;
  }

  /**
   * The group's course: its trajectories and whether the model admits them;
   * none when the span holds no instant on the hold.
   *
   * @param props The planner's readers.
   * @param inheritedPace The original coupled speed limits for a separate trial
   *   of one member.
   * @returns The trajectories in the group's order and the admission; none
   *   without a hold instant.
   */
  export function course(
    props: IProps,
    inheritedPace?: (seconds: number) => number,
  ): ReturnType<typeof HumanArmTrajectory.admitted> | undefined {
    const { span, arms } = props;

    // Each phrase (the reach, the hold, the return) cut at the span's knots,
    // and each piece between two of those instants cut into equal pieces no
    // longer than a frame, its end left to the next: the hold's two ends and
    // every instant that carries a pose constraint are instants of the grid
    // themselves, as trajopt imposes a pose term at a timestep
    // (`problem_description.cpp`; Schulman et al. 2014, section VII-B). Laid
    // beside a span-wide grid instead, an end falls milliseconds from a grid
    // instant, and the arm's frame of travel between the two reads as a speed
    // of tens of metres a second; a knot between two grid instants is met
    // only by the interpolation between them.
    const times: number[] = AutoMovieMotionHumanArmCourse.grid(span);
    const holding: (t: number) => boolean = (t: number): boolean =>
      t >= span.ready - 1e-9 && t <= span.relax + 1e-9;
    const course: Map<number, IAutoMovieMotionHumanArmClearance.IArm[]> =
      new Map();
    const fit: ReturnType<typeof solver> = solver(props);

    if (!times.some(holding)) return undefined;

    // The hold continued frame by frame: its first instant continuing the
    // law's own fit of its goal where the law gives its seed (`hold`), or,
    // with no reach before it, the arms the course leaves from (`entered`),
    // else fitted on its own, and every later one continuing the instant
    // before it
    // (interval continuation of the swivel, an arm's
    // one free coordinate on its goal: Tolani, Goswami and Badler 2000,
    // section 3.2.4), so each instant is reached from its neighbour by the
    // continued fit's own bounded step and neither the elbow's side nor the
    // forearm's twist can jump between two frames; a continuation whose
    // admitted arc vanished refuses at its fit. The reach and the return are
    // the reader's to lay between the rest and these. The full frame-grid
    // admission still checks every displayed instant.
    const problem: HumanArmTrajectory.IProblem = props.problem(times);
    const held: number[] = [];
    times.forEach((t: number, k: number): void => {
      if (holding(t)) held.push(k);
    });
    const goals = (k: number): IAutoMovieHumanLimbGoal[] =>
      arms.map(
        (_: IProps["arms"][number], a: number): IAutoMovieHumanLimbGoal =>
          props.aimed(a, times[k]!),
      );
    const knot = (k: number, from?: IEntered): IHeldFit => ({
      k,
      ...fit(times[k]!, goals(k), from?.near ?? {}, from?.arms),
    });
    // A hold from the course's start, with no reach before it, starts on the
    // arms the course leaves from; after a reach the reader lays the way to
    // whichever solution the hold's first instant takes, the law's own where
    // it gives that solution's seed.
    let previous: IHeldFit = knot(
      held[0]!,
      entered(props, times[held[0]!]!, span.ready > span.start + 1e-9),
    );
    course.set(times[previous.k]!, previous.arms);
    for (let p: number = 1; p < held.length; ++p) {
      previous = knot(held[p]!, previous);
      course.set(times[previous.k]!, previous.arms);
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
    return HumanArmTrajectoryContactContinuation(held, read, props.tempo);
  }

  /**
   * The frame grid, seconds: the finest the optimiser's waypoints are spaced
   * (`HumanArmTrajectory`), the course's instants and the grid a law's arm
   * chain continues on (`AutoMovieMotionHumanArmChain`): the optimiser's own
   * waypoint spacing, not a value of its own.
   */
  export const STEP: number = 1 / 30;

  /**
   * A span's frame grid, seconds: the span's four instants and its knots
   * (`ISpan.knots`) inside it are instants of the grid, and each interval
   * between two of them is cut into equal pieces no longer than `STEP`, so a
   * constrained instant is a waypoint, as trajopt imposes a pose term at a
   * timestep (github.com/joschu/trajopt, `src/trajopt/problem_description.cpp`,
   * pose terms with a `timestep`; Schulman et al. 2014, IJRR 33:1251, section
   * VII-B). With no knots it is the phrases' own grid.
   *
   * @param span The span, with its knots.
   * @returns The grid, ascending, from the start to the end.
   */
  export function grid(span: IAutoMovieMotionHumanArmPlanned.ISpan): number[] {
    const breaks: number[] = [span.start];
    for (const t of [
      span.ready,
      span.relax,
      ...(span.knots ?? []),
      span.end,
    ].sort((a: number, b: number): number => a - b))
      if (t > breaks.at(-1)! + 1e-9 && t <= span.end + 1e-9) breaks.push(t);
    const times: number[] = [];
    for (let i: number = 1; i < breaks.length; ++i) {
      const from: number = breaks[i - 1]!;
      const to: number = breaks[i]!;
      const pieces: number = Math.max(1, Math.ceil((to - from) / STEP - 1e-9));
      for (let j: number = 0; j < pieces; ++j)
        times.push(from + ((to - from) * j) / pieces);
    }
    times.push(span.end);
    return times;
  }
}

/**
 * The arms an instant's fit laid, the seeds it reports for each and the pose
 * they stand in.
 */
interface ISolved {
  /** Each arm's clinical triples, in the group's order. */
  arms: IAutoMovieMotionHumanArmClearance.IArm[];

  /** Each fitted arm's seed, refined to the cold sweep's resolution. */
  near: IAutoMovieMotionHumanResolveHumanPosture.INear;

  /** The pose with every arm fitted. */
  pose: IAutoMoviePose;
}

/** One hold instant's fit: its index on the frame grid and what was laid there. */
interface IHeldFit extends ISolved {
  /** The instant's index in the course's instants. */
  k: number;
}

/**
 * The posture solve of every arm's goal at an instant, continued from (or
 * placed at) the seeds given.
 */
function solver(
  props: AutoMovieMotionHumanArmCourse.IProps,
): (
  t: number,
  goals: readonly IAutoMovieHumanLimbGoal[],
  near: IAutoMovieMotionHumanResolveHumanPosture.INear,
  before?: readonly IAutoMovieMotionHumanArmClearance.IArm[],
) => ISolved {
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
  ): ISolved => {
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
        NonNullable<
          IAutoMovieMotionHumanResolveHumanPosture.INear[AutoMovieHumanLimb]
        >
      >
    > = {};
    for (const a of order) {
      const limb: AutoMovieHumanLimb = `${props.arms[a]!.side}Arm`;
      // The fit itself, not `resolveHumanPosture.limbSeeded`'s independent
      // copy of it: the course only reads the pose it returns and spreads its
      // seed, and a fit leaves its input pose's records as they are.
      const fitted: IAutoMovieSeededChainFit = HumanLimbFit.fit(
        props.body,
        pose,
        limb,
        goals[a]!,
        ["left", "right"],
        undefined,
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
      pose,
    };
  };
}

/**
 * What a hold's first instant continues: the seeds of its arms' fits, and the
 * arms posed in first where they stand on the course's own arms.
 */
interface IEntered {
  /** Each continued arm's seed. */
  near: IAutoMovieMotionHumanResolveHumanPosture.INear;

  /** The arms posed in before the fit, in the group's order; none when absent. */
  arms?: readonly IAutoMovieMotionHumanArmClearance.IArm[];
}

/**
 * What a hold's first instant continues. An arm whose law gives the seed of its
 * own fit of the hold's first goal (`hold`, the grasp the law chose) continues
 * that fit, one model between the law's search and its course. With no reach
 * before the hold (the hold from the course's start), an arm continues the arm
 * the course leaves from: its rest posed on the base the planner solved at that
 * instant, and the swivel and branch it shows there (`HumanLimbFit.seed`, in
 * closed form), the solution of its goal nearest the arm shown, which a plan
 * starts from (its displayed entry), rather than a cold fit's, which may place
 * the same hand with the elbow elsewhere: with no reach between them that
 * difference is a step. After a reach, an arm with no seed of its law's is
 * fitted on its own, the reader laying the way to it.
 *
 * @returns The continuation; none where every arm is fitted on its own.
 */
function entered(
  props: AutoMovieMotionHumanArmCourse.IProps,
  t: number,
  reached: boolean,
): IEntered | undefined {
  if (
    reached &&
    props.arms.every(
      (arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number]): boolean =>
        arm.hold === undefined,
    )
  )
    return undefined;
  let pose: IAutoMoviePose = props.at(t).pose;
  if (!reached)
    for (const arm of props.arms)
      pose = HumanArmClearance.posed(pose, arm.side, arm.rest);
  const near: Partial<
    Record<
      AutoMovieHumanLimb,
      NonNullable<
        IAutoMovieMotionHumanResolveHumanPosture.INear[AutoMovieHumanLimb]
      >
    >
  > = {};
  for (const arm of props.arms) {
    const limb: AutoMovieHumanLimb = `${arm.side}Arm`;
    const seed: IAutoMovieSwivelSeed | null =
      arm.hold ?? (reached ? null : HumanLimbFit.seed(props.body, pose, limb));
    if (seed !== null)
      near[limb] = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
  }
  return reached
    ? { near }
    : {
        near,
        arms: props.arms.map(
          (
            arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number],
          ): IAutoMovieMotionHumanArmClearance.IArm => arm.rest,
        ),
      };
}
