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
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryContactContinuation } from "../posture/HumanArmTrajectoryContactContinuation";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";

/**
 * An arm group's action laid without trajectory optimisation: kept when it
 * meets every bound a solved trajectory meets (`HumanArmTrajectory.admitted`),
 * else the optimiser's seed (`HumanArmTrajectory.solve`).
 *
 * On the frame grid of the span (and its `ready` and `relax`):
 *
 * - The hold: every arm's goal at the instant, each arm on the base the planner
 *   already solved (`HumanLimbFit.fit`), the riding arm after the one it rides,
 *   on the pose that one placed: fitted at every frame, each continuing the
 *   frame before it (`IAutoMovieSwivelNear`), the first of a hold with no reach
 *   before it continuing the arms the course leaves from (their `rest`), so
 *   neither the branch nor the forearm's twist hops between two frames or away
 *   from the arm shown;
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

    /** The span's instants, seconds. */
    span: { start: number; ready: number; relax: number; end: number };

    /**
     * The current duration divided by the law's original duration, for an
     * explicit replan.
     */
    tempo?: number;

    /**
     * Each arm's side, rest, return and the bone of another arm its grip rides,
     * in the group's order.
     */
    arms: readonly {
      side: "left" | "right";
      rest: IAutoMovieMotionHumanArmAngles.IAngles;
      back?: IAutoMovieMotionHumanArmAngles.IAngles;
      on?: string;
    }[];

    /**
     * The posture so far and its pose with the group's arms left out, at an
     * instant.
     */
    at: (seconds: number) => {
      posture: IAutoMovieMotionHumanPosture;
      pose: IAutoMoviePose;
    };

    /** An arm's goal at an instant, as the plan perceives it. */
    aimed: (arm: number, seconds: number) => IAutoMovieHumanLimbGoal;

    /** The trajectory problem on given waypoints, the optimiser's own. */
    problem: (times: readonly number[]) => HumanArmTrajectory.IProblem;

    /** The plan's exact FK reader. */
    resolution: ReturnType<typeof prepareHumanPoseResolution>;
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
    const course: Map<number, IAutoMovieMotionHumanArmClearance.IArm[]> =
      new Map();
    const fit: ReturnType<typeof solver> = solver(props);

    if (!times.some(holding)) return undefined;

    // The hold continued frame by frame: its first instant fitted on its own
    // or, with no reach before it, continuing the arms the course leaves from
    // (`rested`), and every later one continuing the instant before it
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
    const knot = (k: number, from?: ISolved): IHeldFit => ({
      k,
      ...fit(times[k]!, goals(k), from?.near ?? {}, from?.arms),
    });
    // A hold from the course's start, with no reach before it, starts on the
    // arms the course leaves from; after a reach the reader lays the way to
    // whichever solution the hold's first instant takes.
    let previous: IHeldFit = knot(
      held[0]!,
      span.ready > span.start + 1e-9
        ? undefined
        : rested(props, times[held[0]!]!),
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
    return HumanArmTrajectoryContactContinuation(
      problem,
      held,
      read,
      props.tempo,
    );
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
 * The arms a course leaves from, as the hold's first instant continues them:
 * each arm's rest posed on the base the planner solved at that instant, and the
 * swivel and branch each shows there (`HumanLimbFit.seed`, in closed form). The
 * hold then starts on the solution of its goal nearest the arm shown, which a
 * plan starts from (its displayed entry), rather than on a cold fit's, which
 * may place the same hand with the elbow elsewhere: with no reach between them
 * (the hold from the course's start) that difference is a step.
 */
function rested(
  props: AutoMovieMotionHumanArmCourse.IProps,
  t: number,
): ISolved {
  let pose: IAutoMoviePose = props.at(t).pose;
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
    const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
      props.body,
      pose,
      limb,
    );
    if (seed !== null)
      near[limb] = { ...seed, tolerance: hingedArmSwivel.RESOLUTION };
  }
  return {
    arms: props.arms.map(
      (
        arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number],
      ): IAutoMovieMotionHumanArmClearance.IArm => arm.rest,
    ),
    near,
    pose,
  };
}
