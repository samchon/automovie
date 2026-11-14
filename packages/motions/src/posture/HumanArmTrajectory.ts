import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
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
 * (`HumanArmSeed`). Two arms that move over one span are one problem, their probes kept
 * clear of each other as they both move: planning one after the other is
 * incomplete where their paths are coupled (Erdmann and Lozano-Pérez 1987,
 * Algorithmica 2:477). One arm alone is solved as the right arm in the
 * mirror image of its world, so mirrored scenes give mirrored paths. A
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
   * Solve the problem.
   *
   * @param problem The problem.
   * @returns Each arm's trajectory, in the problem's order.
   * @throws {HumanRefusal} When no trajectory meets the constraints.
   */
  export function solve(problem: IProblem): Trajectory[] {
    if (problem.arms.length === 1 && problem.arms[0]!.side === "left") {
      const arm: IArm = problem.arms[0]!;
      return solve({
        ...problem,
        bases: problem.bases.map(HumanArmMirror.mirrored),
        arms: [
          {
            ...arm,
            side: "right",
            sites: arm.sites.map((s: ISite | undefined): ISite | undefined =>
              s === undefined ? undefined : mirroredSite(s),
            ),
          },
        ],
      });
    }
    const context: M.IContext = HumanArmTrajectoryContext.of(problem);
    const n: number = context.n;
    const times: readonly number[] = context.times;
    const { x, evaluation: current }: { x: number[][][]; evaluation: M.IEvaluation } = HumanArmOptimiser.optimise(context, HumanArmSeed.seed(problem, context));
    if (current.worst.value > M.TOLERANCE)
      throw new HumanRefusal({
        kind: "reach",
        axis: current.worst.axis,
        value: current.worst.axis === "duration" ? times[n - 1]! - times[0]! : current.worst.value,
        feasible: null,
        reason: `no path of the ${problem.arms.map((a: IArm): string => a.side).join(" and ")} arm over the action keeps the hand on its site, the arm clear and its speed within the audit's ${M.SPEED_LIMIT} m/s: ${current.worst.what}`,
        fix:
          current.worst.axis === "duration"
            ? "give the action more time"
            : "put the hand on a site its arm reaches with the body clear",
      });
    return problem.arms.map(
      (_: IArm, a: number): Trajectory =>
        (seconds: number): HumanArmClearance.IArm =>
          G.arm(context.setups[a]!, hermite(times, x[a]!, seconds)),
    );
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
    };
  }
}

/** A cubic Hermite through waypoints at their seconds, tangents by central differences in time, still at both ends. */
function hermite(
  times: readonly number[],
  x: readonly (readonly number[])[],
  seconds: number,
): number[] {
  const n: number = times.length;
  if (seconds <= times[0]!) return [...x[0]!];
  if (seconds >= times[n - 1]!) return [...x[n - 1]!];
  let k: number = 0;
  while (k + 2 < n && times[k + 1]! <= seconds) ++k;
  const h: number = times[k + 1]! - times[k]!;
  const u: number = (seconds - times[k]!) / h;
  const tangent = (j: number): number[] =>
    j === 0 || j === n - 1
      ? new Array(G.DIMENSIONS).fill(0)
      : x[j + 1]!.map(
          (v: number, d: number): number =>
            (v - x[j - 1]![d]!) / (times[j + 1]! - times[j - 1]!),
        );
  const m0: number[] = tangent(k);
  const m1: number[] = tangent(k + 1);
  const h00: number = 2 * u ** 3 - 3 * u ** 2 + 1;
  const h10: number = u ** 3 - 2 * u ** 2 + u;
  const h01: number = -2 * u ** 3 + 3 * u ** 2;
  const h11: number = u ** 3 - u ** 2;
  return x[k]!.map(
    (v: number, d: number): number =>
      h00 * v + h10 * h * m0[d]! + h01 * x[k + 1]![d]! + h11 * h * m1[d]!,
  );
}
