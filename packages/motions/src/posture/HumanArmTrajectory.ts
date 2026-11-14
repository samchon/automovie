import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmRefine } from "./HumanArmRefine";
import { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * A performer's arms over one action as one trajectory optimisation, in
 * TrajOpt's formulation (Schulman et al. 2014, "Motion planning with
 * sequential convex optimization and convex collision checking", IJRR
 * 33:1251): the arms' joint-space waypoints over the reach, the hold and the
 * return are the variables, the objective and the constraints are
 * `HumanArmTrajectoryModel`'s, and the problem is solved by penalty
 * sequential convex optimisation with a trust region (TrajOpt's Algorithm
 * 1, `HumanArmOptimiser`) from a seed whose hold is solved by inverse
 * kinematics and whose reach and return are a sampling planner's clear paths
 * (`HumanArmSeed`), its waypoints refined where they do not bound what lies
 * between them (`HumanArmRefine`). Two arms that move over one span are one problem, their probes kept
 * clear of each other as they both move: planning one after the other is
 * incomplete where their paths are coupled (Erdmann and Lozano-Pérez 1987,
 * Algorithmica 2:477). A problem whose first arm is the left is solved as its mirror image, the arms on the other side, so mirrored scenes give mirrored paths. A
 * problem still infeasible at the last penalty is refused.
 */
export namespace HumanArmTrajectory {
  /** The hand on its site at a hold waypoint (`M.ISite`). */
  export type ISite = M.ISite;

  /** One arm's task. */
  export interface IArm {
    /** The arm. */
    side: "left" | "right";
    /** The arm at the first waypoint, and at the last unless `back` is given. */
    rest: HumanArmClearance.IArm;
    /** The arm at the last waypoint, where it returns to another arm than it left (a gesture that leaves from the entry and returns to the rest); `rest` when absent. */
    back?: HumanArmClearance.IArm;
    /** Its site at each waypoint, on the hold. */
    sites: readonly (ISite | undefined)[];
    /** The arm the goal's own solution gives at the hold's start, where its inverse kinematics starts first (`HumanArmSeed`). */
    guess?: HumanArmClearance.IArm;
    /** Its segments' declared rests over the hold (M.IRest). */
    rests?: readonly M.IRest[];
    /** Its segments that grasp one object with the other arm over the action (`M.IContext.grasped`). */
    grasp?: readonly M.Segment[];
  }

  /** The problem. */
  export interface IProblem {
    /** The body. */
    body: IHumanBody;
    /** The waypoints' seconds, in time order. */
    times: readonly number[];
    /** What every arm is read against at each waypoint, the arms of the problem left out. */
    bases: readonly G.IBase[];
    /** The arms, one or two. */
    arms: readonly IArm[];
    /** The share of the reach made at a second of the reach, and of the return left at a second of the return: 0 at rest, 1 on the hold. */
    share: (seconds: number) => number;
  }

  /** An arm at any second of the span. */
  export type Trajectory = (seconds: number) => HumanArmClearance.IArm;

  /**
   * Solve the problem, its waypoints refined where they do not bound what
   * lies between them (`HumanArmRefine`): first on the seed, then on each
   * solution, which is solved again from itself on the refined waypoints
   * until every interval bounds its site's path and its probes' clearance
   * or is down to the frame grid, the check-and-refine loop of a continuous
   * collision check. A solution that does not meet its constraints is also
   * refined about the waypoint it fails at, the discretisation being what a
   * continuous constraint (a sweep, a speed) is met on, and solved again.
   *
   * @param read The problem on given waypoints' seconds.
   * @param times The first waypoints' seconds, ascending.
   * @returns Each arm's trajectory, in the problem's order.
   * @throws {HumanRefusal} When no trajectory meets the constraints.
   */
  export function solve(read: (times: readonly number[]) => IProblem, times: readonly number[]): Trajectory[] {
    const first: IProblem = read(times);
    const reading: (times: readonly number[]) => IProblem = leftFirst(first) ? (t: readonly number[]): IProblem => mirrored(read(t)) : read;
    let problem: IProblem = leftFirst(first) ? mirrored(first) : first;
    let context: M.IContext = HumanArmTrajectoryContext.of(problem);
    // The frame grid over the span, the instants between waypoints are read at.
    const start: number = times[0]!;
    const end: number = times[times.length - 1]!;
    const grid: number[] = [start];
    for (let j: number = 1; start + j * STEP < end - 1e-9; ++j) grid.push(start + j * STEP);
    grid.push(end);
    const fine: M.IContext = HumanArmTrajectoryContext.of(reading(grid));
    // Split where the waypoints do not bound what lies between them, and
    // about a waypoint the solve could not meet its constraints at, the arms
    // carried onto the new waypoints by their own interpolant.
    const refined = (x: number[][][], failed?: M.IEvaluation): number[][][] | undefined => {
      const split: number[] = HumanArmRefine.unbounded(context, fine, x);
      if (failed !== undefined && failed.worst.value > M.TOLERANCE)
        for (const k of [failed.worst.at - 1, failed.worst.at])
          if (k >= 0 && k + 1 < context.n && context.times[k + 1]! - context.times[k]! >= 2 * STEP - 1e-9 && !split.includes(k)) split.push(k);
      split.sort((p: number, q: number): number => p - q);
      if (split.length === 0) return undefined;
      const next: number[] = HumanArmRefine.split(context.times, split);
      const carried: number[][][] = x.map((arm: number[][]): number[][] => next.map((t: number): number[] => HumanArmRefine.hermite(context.times, arm, t)));
      problem = reading(next);
      context = HumanArmTrajectoryContext.of(problem);
      return carried;
    };
    let seed: number[][][] = HumanArmSeed.seed(problem, context);
    for (let again: number[][][] | undefined = refined(seed); again !== undefined; again = refined(seed)) seed = again;
    let solved: { x: number[][][]; evaluation: M.IEvaluation; penalty: number } = HumanArmOptimiser.optimise(context, seed);
    for (let again: number[][][] | undefined = refined(solved.x, solved.evaluation); again !== undefined; again = refined(solved.x, solved.evaluation))
      solved = HumanArmOptimiser.optimise(context, again, solved.penalty);
    const { x, evaluation: current }: { x: number[][][]; evaluation: M.IEvaluation; penalty: number } = solved;
    const n: number = context.n;
    const at: readonly number[] = context.times;
    if (current.worst.value > M.TOLERANCE)
      throw new HumanRefusal({
        kind: "reach",
        axis: current.worst.axis,
        value: current.worst.axis === "duration" ? at[n - 1]! - at[0]! : current.worst.value,
        feasible: null,
        reason: `no path of the ${problem.arms.map((a: IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site, the arm clear and its speed within the audit's ${M.SPEED_LIMIT} m/s: ${current.worst.what}`,
        fix:
          current.worst.axis === "duration"
            ? "give the action more time"
            : "put the hand on a site its arm reaches with the body clear",
      });
    const setups: G.ISetup[] = context.setups;
    return problem.arms.map(
      (_: IArm, a: number): Trajectory =>
        (seconds: number): HumanArmClearance.IArm =>
          G.arm(setups[a]!, HumanArmRefine.hermite(at, x[a]!, seconds)),
    );
  }

  /**
   * Whether the problem is solved in the mirror image of its world: when its
   * first arm is the left. The mirror takes every arm to the other side in
   * order, so of a problem and its mirror image exactly one begins with the
   * right arm, and that one is solved; the other is its mirror. A left arm
   * alone and a pair listed left first are solved as their mirrors, so
   * mirrored scenes give mirrored paths to the bit.
   */
  function leftFirst(problem: IProblem): boolean {
    return problem.arms[0]!.side === "left";
  }

  /** A problem in the mirror image of its world: every arm on the other side, its sites, rests and bases mirrored. */
  function mirrored(problem: IProblem): IProblem {
    return {
      ...problem,
      bases: problem.bases.map(mirroredBase),
      arms: problem.arms.map(
        (arm: IArm): IArm => ({
          ...arm,
          side: arm.side === "left" ? "right" : "left",
          sites: arm.sites.map((s: ISite | undefined): ISite | undefined => (s === undefined ? undefined : mirroredSite(s))),
          ...(arm.rests === undefined
            ? {}
            : { rests: arm.rests.map((r: M.IRest): M.IRest => ({ ...r, on: HumanArmMirror.opposite(r.on as AutoMovieHumanoidBone) })) }),
        }),
      ),
    };
  }
  /** A base's mirror image (`HumanArmMirror.mirrored`), one record per base, so the frames built on it are built once. */
  function mirroredBase(base: G.IBase): G.IBase {
    let found: G.IBase | undefined = MIRRORED.get(base);
    if (found === undefined) MIRRORED.set(base, (found = HumanArmMirror.mirrored(base)));
    return found;
  }

  /** A site's mirror image across the world's x = 0 plane. */
  function mirroredSite(site: ISite): ISite {
    return {
      ...site,
      point: HumanArmMirror.flip(site.point),
      contact: HumanArmMirror.flip(site.contact),
      ...(site.rotation === undefined
        ? {}
        : { rotation: HumanArmMirror.turn(site.rotation) }),
      // A site riding another arm's segment, in that segment's own frame.
      ...(site.on === undefined
        ? {}
        : {
            on: {
              ...site.on,
              point: HumanArmMirror.flip(site.on.point),
              normal: HumanArmMirror.flip(site.on.normal),
              ...(site.on.rotation === undefined ? {} : { rotation: HumanArmMirror.turn(site.on.rotation) }),
            },
          }),
    };
  }
}

/** The frame grid, seconds: the instants between waypoints are read at. */
const STEP: number = 1 / 30;

/** Each base's mirror image, kept while the base is held. */
const MIRRORED: WeakMap<G.IBase, G.IBase> = new WeakMap();
