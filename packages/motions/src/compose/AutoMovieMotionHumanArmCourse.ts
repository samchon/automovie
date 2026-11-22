import { Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";
import { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanArmTrajectoryContactContinuation } from "../posture/HumanArmTrajectoryContactContinuation";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { AutoMovieMotionHumanArmAngles } from "./AutoMovieMotionHumanArmAngles";

/**
 * An arm group's action laid without trajectory optimisation: kept when it
 * meets every bound a solved trajectory meets
 * (`HumanArmTrajectory.admitted`), else the optimiser's seed
 * (`HumanArmTrajectory.solve`).
 *
 * On the frame grid of the span (and its `ready` and `relax`):
 *
 * - the hold: every arm's goal at the instant, each arm on the base the
 *   planner already solved (`HumanLimbFit.fit`), the riding arm after the
 *   one it rides, on the pose that one placed: fitted at adaptive knots,
 *   each continuing the knot it splits from, and placed in closed form
 *   between them at the interpolated swivels where that stays within the
 *   trajectory's tolerance of the knot's own fit (`IAutoMovieSwivelNear`),
 *   so the branch never hops between two frames;
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
   * @evidence contracts/development/implementation.md#principled-implementation The hold is the rig's analytic two-bone fit at adaptive knots, each continuing the knot it splits from, and the closed-form placement at the interpolated swivel between them (Tolani, Goswami and Badler 2000, section 3.2.4), split where the placement leaves the knot's fit by more than the trajectory's tolerance (Douglas and Peucker 1973's error-bounded subdivision); the transports are the trajectory reader's blend, and the whole is admitted by the trajectory model's own feasibility reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The instants, one recursive knot judgement over the hold, the original model admission, then a local contact-branch continuation for a refused hold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is admitted that the model refuses; a refused course only seeds the optimiser, every requirement intact.
   * @evidence contracts/development/implementation.md#efficient-algorithms A refined two-bone limb fit per arm only at a knot (the hold's ends and each split interval's middle), and a closed-form placement at a prescribed swivel at every other hold instant, on the planner's solved base with no posture solve; no fit on a transport instant, then one model evaluation, in place of the optimiser's penalty rounds of convexified programmes and its sampling planner.
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

    // The hold on adaptive knots: its first instant fitted cold and its last
    // continuing it; an interval's middle instant is fitted continuing the
    // interval's start, and the arms are placed there in closed form at the
    // swivels interpolated between the interval's ends (Tolani, Goswami and
    // Badler 2000, section 3.2.4: the swivel is an arm's one free
    // coordinate on its goal). The interval is split at its middle where
    // the ends lie on different branches, where the placement does not stand
    // as prescribed, or where it puts an elbow, a wrist or a knuckle farther
    // than the trajectory's own tolerance from the middle's fit, down to the
    // frame grid: the error-bounded subdivision of a curve's samples
    // (Douglas and Peucker 1973) on the swivel, the judgement
    // `courseLimbSwivels` makes for a display. Every instant of an interval
    // left whole is placed at its interpolated swivels, each continuing the
    // interval start's arms, so the elbow never changes its side between
    // two frames; the reach and the return are the reader's to lay between
    // the rest and these. The full frame-grid admission still checks every
    // displayed instant.
    const problem: HumanArmTrajectory.IProblem = props.problem(times);
    const held: number[] = [];
    times.forEach((t: number, k: number): void => {
      if (holding(t)) held.push(k);
    });
    const ends: ReadonlySet<AutoMovieHumanoidBone> = probes(arms);
    const tolerance: number = HumanArmTrajectoryTerms.TOLERANCE / 1000;
    const goals = (k: number): IAutoMovieHumanLimbGoal[] =>
      arms.map(
        (_: IProps["arms"][number], a: number): IAutoMovieHumanLimbGoal =>
          props.aimed(a, times[k]!),
      );
    const knot = (k: number, from?: IHeldFit): IHeldFit => ({
      k,
      ...fit(times[k]!, goals(k), from?.near ?? {}, from?.arms),
    });
    const place = (k: number, a: IHeldFit, b: IHeldFit): IHeldFit => {
      const share: number =
        (times[k]! - times[a.k]!) / (times[b.k]! - times[a.k]!);
      return {
        k,
        ...fit(times[k]!, goals(k), between(a.near, b.near, share), a.arms),
      };
    };
    const judge = (i: number, j: number, a: IHeldFit, b: IHeldFit): void => {
      if (j - i <= 1) return;
      const m: number = (i + j) >> 1;
      const own: IHeldFit = knot(held[m]!, a);
      let laid: IHeldFit | undefined;
      let split: boolean = branched(a.near, b.near);
      if (!split) {
        laid = place(held[m]!, a, b);
        const share: number =
          (times[held[m]!]! - times[a.k]!) / (times[b.k]! - times[a.k]!);
        split =
          !stands(between(a.near, b.near, share), laid.near) ||
          apart(props.body, laid.pose, own.pose, ends) > tolerance;
      }
      if (split) {
        course.set(times[own.k]!, own.arms);
        judge(i, m, a, own);
        judge(m, j, own, b);
        return;
      }
      for (let p: number = i + 1; p < j; ++p)
        course.set(
          times[held[p]!]!,
          p === m ? laid!.arms : place(held[p]!, a, b).arms,
        );
    };
    const first: IHeldFit = knot(held[0]!);
    course.set(times[first.k]!, first.arms);
    if (held.length > 1) {
      const last: IHeldFit = knot(held[held.length - 1]!, first);
      course.set(times[last.k]!, last.arms);
      judge(0, held.length - 1, first, last);
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
 * The prescription between two knots' fits at a share of their interval:
 * each arm's swivel turned the shorter way and its forearm twist carried
 * linearly, on the start's branch, prescribed so the closed form places the
 * arm there (`IAutoMovieSwivelNear.prescribed`).
 */
function between(
  a: IAutoMovieMotionHumanResolveHumanPosture.INear,
  b: IAutoMovieMotionHumanResolveHumanPosture.INear,
  share: number,
): IAutoMovieMotionHumanResolveHumanPosture.INear {
  const out: [AutoMovieHumanLimb, IAutoMovieSwivelNear][] = [];
  for (const [limb, from] of Object.entries(a) as [
    AutoMovieHumanLimb,
    IAutoMovieSwivelNear,
  ][]) {
    const to: IAutoMovieSwivelNear | undefined = b[limb];
    const turn: number =
      to === undefined || to.branch !== from.branch
        ? 0
        : to.swivel - from.swivel;
    const twist: number | undefined =
      from.twist === undefined
        ? undefined
        : to?.twist === undefined || to.branch !== from.branch
          ? from.twist
          : from.twist + (to.twist - from.twist) * share;
    out.push([
      limb,
      {
        swivel: from.swivel + (turn - 360 * Math.round(turn / 360)) * share,
        branch: from.branch,
        ...(twist === undefined ? {} : { twist }),
        tolerance: hingedArmSwivel.RESOLUTION,
        prescribed: true,
      },
    ]);
  }
  return Object.fromEntries(out);
}

/** Whether two knots' fits hold every arm on one branch. */
function branched(
  a: IAutoMovieMotionHumanResolveHumanPosture.INear,
  b: IAutoMovieMotionHumanResolveHumanPosture.INear,
): boolean {
  return (Object.entries(a) as [AutoMovieHumanLimb, IAutoMovieSwivelNear][]).some(
    ([limb, seed]: [AutoMovieHumanLimb, IAutoMovieSwivelNear]): boolean =>
      b[limb]?.branch !== seed.branch,
  );
}

/**
 * Whether a prescribed placement stands as prescribed: the closed form
 * reports exactly the prescribed swivel and branch, where any other seed
 * means it fell back to a refine (out of reach or range, or through what the
 * arm keeps clear of).
 */
function stands(
  prescribed: IAutoMovieMotionHumanResolveHumanPosture.INear,
  got: IAutoMovieMotionHumanResolveHumanPosture.INear,
): boolean {
  return (
    Object.entries(prescribed) as [AutoMovieHumanLimb, IAutoMovieSwivelNear][]
  ).every(([limb, seed]: [AutoMovieHumanLimb, IAutoMovieSwivelNear]): boolean => {
    const placed: IAutoMovieSwivelNear | undefined = got[limb];
    return (
      placed !== undefined &&
      placed.branch === seed.branch &&
      Math.abs(placed.swivel - seed.swivel) <= 1e-9
    );
  });
}

/** The probes where an arm's swivel shows, per arm: the elbow, the wrist and the hand's middle knuckle. */
function probes(
  arms: AutoMovieMotionHumanArmCourse.IProps["arms"],
): ReadonlySet<AutoMovieHumanoidBone> {
  return new Set<AutoMovieHumanoidBone>(
    arms.flatMap(
      (
        arm: AutoMovieMotionHumanArmCourse.IProps["arms"][number],
      ): AutoMovieHumanoidBone[] => [
        `${arm.side}LowerArm`,
        `${arm.side}Hand`,
        `${arm.side}MiddleProximal`,
      ],
    ),
  );
}

/** The farthest any probe lies between two poses, metres. */
function apart(
  body: IAutoMovieMotionHumanBody,
  a: IAutoMoviePose,
  b: IAutoMoviePose,
  ends: ReadonlySet<AutoMovieHumanoidBone>,
): number {
  const p: ReturnType<typeof poseBones> = poseBones(body, a, undefined, ends);
  const q: ReturnType<typeof poseBones> = poseBones(body, b, undefined, ends);
  let worst: number = 0;
  for (const bone of ends) {
    const x: IAutoMovieResolvedBone | undefined = p.get(bone);
    const y: IAutoMovieResolvedBone | undefined = q.get(bone);
    if (x === undefined || y === undefined) continue;
    worst = Math.max(worst, Vector3.distance(x.worldPosition, y.worldPosition));
  }
  return worst;
}

/** The arms an instant's fit laid, the seeds it reports for each and the pose they stand in. */
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

/** The posture solve of every arm's goal at an instant, continued from (or placed at) the seeds given. */
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
        NonNullable<IAutoMovieMotionHumanResolveHumanPosture.INear[AutoMovieHumanLimb]>
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
