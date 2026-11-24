import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HUMAN_ARM_COORDINATE_RATES as RATES } from "./HUMAN_ARM_COORDINATE_RATES";
import { HumanArmConnect } from "./HumanArmConnect";
import { HumanArmDifferential } from "./HumanArmDifferential";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmSeedSpace as Space } from "./HumanArmSeedSpace";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/** The record of `IInstantAt`'s site. */
type IInstantAt = { x: number[][][]; evaluation: M.IEvaluation };

/** The record of `IProblemArmsItem`'s site. */
type IProblemArmsItem = {
  /**
   * The arm the goal's own solution gives at the hold's start, the first start
   * of its inverse kinematics.
   */
  guess?: IAutoMovieMotionHumanArmClearance.IArm;
};

/**
 * The seed of an arms' trajectory, as MoveIt seeds a trajectory optimiser: a
 * goal by inverse kinematics, a path to it by a sampling planner, and the path
 * handed to the optimiser as its start (`OptimizerAdapter::adaptAndPlan`,
 * moveit/moveit
 * moveit_planners/chomp/chomp_optimizer_adapter/src/chomp_optimizer_adapter.cpp
 * lines 177-209 at commit 811328b1ba700f5d2dff69afc9737ac6cab66c9b,
 * BSD-3-Clause, Copyright (c) 2018, Raghavender Sahdev), every solve seeded so;
 * a sampling planner that finds no path ends the plan, as the adapter returns
 * the planner's failure, with a refusal that says so.
 *
 * The goal is the hold's first waypoint: the arms' configuration with every
 * hand on its site and every arm clear, solved as a still problem of that one
 * instant (`HumanArmTrajectoryModel`, its ends left out) once from the caller's
 * seed, as MoveIt's inverse kinematics solves at a zero timeout. The hold's
 * later waypoints carry it by the sites' motion (differential inverse
 * kinematics, the map the follower uses), and the trajectory's optimiser solves
 * them. The reach is RRT-Connect's path in the arms' joint space, indexed by
 * the share of the reach, from the rest arms to the hold's first configuration
 * (`HumanArmConnect`), the return its path from the exit arms to the hold's
 * last, each state valid by the one reading the trajectory refuses by
 * (`HumanArmTrajectoryModel.invalid`) at the waypoint its share reaches, the
 * hold's task points only for the hold itself, so every state is read where it
 * happens (EXOTica's time-indexed RRT-Connect over OMPL's box sampler, the
 * shoulder chart's disc left to the validity reading). A reach waypoint is the
 * path's state at the share the carry has made at its second.
 */
export namespace HumanArmSeed {
  /** What the seed reads. */
  export interface IProblem extends HumanArmTrajectoryContext.IProblem {
    /** The arms, each with the arm its inverse kinematics starts from first. */
    arms: readonly (HumanArmTrajectoryContext.IProblem["arms"][number] &
      IProblemArmsItem)[];
    /**
     * The share of the reach made at a second of the reach, and of the return
     * left at a second of the return, 0 at rest and 1 on the hold.
     */
    share: (seconds: number) => number;
  }

  /**
   * Each arm's coordinates at each waypoint.
   *
   * @param problem The problem.
   * @param context Its context.
   * @param hold The arms' configuration at the hold's first waypoint of this
   *   context, already solved for this problem (`held`); solved here when
   *   absent.
   * @param fine The context at the frame grid's instants over the same span,
   *   where the sampling planner reads a state's validity; the waypoints' when
   *   absent.
   * @returns The seed.
   * @throws {HumanRefusal} When no start gives a feasible hold.
   */
  export function seed(
    problem: IProblem,
    context: M.IContext,
    hold?: readonly (readonly number[])[],
    fine?: M.IContext,
  ): number[][][] {
    const n: number = context.n;
    const times: readonly number[] = context.times;
    const holds: number[] = holdWindow(problem, context);
    if (holds.length === 0)
      throw new Error(
        "An arm seed needs a hold: no waypoint inside the action has a site for every arm",
      );
    const first: number = holds[0]!;
    const last: number = holds[holds.length - 1]!;
    const held: number[][][] = goal(problem, context, first, last, hold);
    const space: Space.ISpace = Space.sampler(context);
    // A path from an end of the action to the hold, through the waypoints
    // `passes` from that end's to the hold's: each configuration carries its
    // time as its last coordinate, 0 at that end's waypoint and 1 at the
    // hold's, and is valid in the scene at that time, as EXOTica's
    // time-indexed problem updates its scene to a state's own time
    // (`TimeIndexedSamplingProblem::Update`), read at the frame nearest it,
    // the scene's finest instants (time-indexed RRT-Connect,
    // `HumanArmConnect`). The hold's task
    // points bind the hold itself alone, at share 1: an approach read at the
    // hold's waypoint keeps its contact allowances, as a pick's approach is
    // allowed its grasp's contact (MoveIt's pick approach), but not the hold's
    // task points, which would wall the hold off from every edge that leaves
    // it; read before the hold's waypoint instead, the contact itself would.
    const path: (
      from: number[][],
      to: number[][],
      passes: readonly number[],
    ) => number[][] = (
      from: number[][],
      to: number[][],
      passes: readonly number[],
    ): number[][] => {
      const begin: number = times[passes[0]!]!;
      const end: number = times[passes[passes.length - 1]!]!;
      const scene: M.IContext = fine ?? context;
      const dims: number = from.length * G.DIMENSIONS;
      const where: (s: number) => number = (s: number): number => {
        const at: number = begin + s * (end - begin);
        let best: number = 0;
        scene.times.forEach((v: number, g: number): void => {
          if (Math.abs(v - at) < Math.abs(scene.times[best]! - at)) best = g;
        });
        return best;
      };
      const start: number[] = [...from.flat(), 0];
      const goal: number[] = [...to.flat(), 1];
      const found: number[][] | null = HumanArmConnect.connect({
        start,
        goal,
        low: space.low,
        high: space.high,
        valid: (q: readonly number[]): boolean =>
          M.invalid(
            scene,
            where(q[dims]!),
            Space.split(q.slice(0, dims)),
            false,
            q[dims]! >= 1,
          ).value <= M.TOLERANCE,
        // The time coordinate runs from 0 to 1 over the passes' seconds.
        seconds: Math.abs(end - begin),
        // The arms' joint velocity limits, the published human rates.
        velocities: from.flatMap((): readonly number[] => RATES),
      });

      // The sampling planner seeds the optimiser, as MoveIt's optimiser
      // adapter seeds it (`chomp_optimizer_adapter.cpp`, `adaptAndPlan`), and
      // a planner that finds no path ends the plan there.
      if (found === null)
        throw new HumanRefusal({
          kind: "reach",
          axis: "region",
          value: context.times[passes[passes.length - 1]!]!,
          feasible: null,
          reason: `the sampling planner finds no path of the ${problem.arms.map((arm: IProblem["arms"][number]): string => arm.side).join(" and ")} arm between its rest and the hold within its iterations`,
          fix: "put the hand on a site its arm reaches with the body clear",
        });
      return found;
    };
    const span: (a: number, b: number) => number[] = (
      a: number,
      b: number,
    ): number[] =>
      Array.from(
        { length: b - a + 1 },
        (_: unknown, i: number): number => a + i,
      );
    // A hold from the first instant has no reach: the arm already holds its
    // site as it enters (its hold was started from that rest), so the rest
    // and the hold's first configuration are joined directly, never searched
    // for as a reach that has no time.
    const reach: number[][] =
      first === 1 && problem.share(times[1]!) >= 1
        ? [
            [...context.rest.flat(), 0],
            [...held[0]!.flat(), 1],
          ]
        : path(context.rest, held[0]!, span(0, first));

    // A hold that lasts to the end has no return to join.
    const back: number[][] = context.open
      ? []
      : path(context.back, held[held.length - 1]!, span(last, n - 1).reverse());
    return problem.arms.map(
      (_: IProblem["arms"][number], a: number): number[][] =>
        times.map((t: number, k: number): number[] => {
          if (k === 0) return [...context.rest[a]!];
          if (!M.inner(context, k)) return [...context.back[a]!];
          if (k >= first && k <= last) return [...held[k - first]![a]!];
          // The path read at the waypoint's own time on it.
          const along: number[] = Space.at(
            k < first ? reach : back,
            k < first
              ? (t - times[0]!) / (times[first]! - times[0]!)
              : (t - times[n - 1]!) / (times[last]! - times[n - 1]!),
          );
          return along.slice(a * G.DIMENSIONS, (a + 1) * G.DIMENSIONS);
        }),
    );
  }

  /**
   * The hold's configurations, each a list of the arms' coordinates: the
   * inverse kinematics of the hold's first waypoint, carried across the hold by
   * the sites' motion. The return's path and the optimiser need a valid end, so
   * a carried last configuration that is not clear is projected onto the
   * feasible set by the last waypoint's own inverse kinematics, started from
   * the carried configuration (the endpoint repair of a sampling planner's
   * goal).
   */
  function goal(
    problem: IProblem,
    context: M.IContext,
    first: number,
    last: number,
    known?: readonly (readonly number[])[],
  ): number[][][] {
    const hold: number[][][] = carried(
      context,
      known === undefined
        ? instant(problem, context, first)
        : known.map((v: readonly number[]): number[] => [...v]),
      first,
      last,
    );
    if (M.invalid(context, last, hold[hold.length - 1]!).value > M.TOLERANCE)
      hold[hold.length - 1] = instant(
        problem,
        context,
        last,
        hold[hold.length - 1]!,
      );
    return hold;
  }

  /**
   * Refuse a problem whose hold no configuration meets, before any trajectory
   * is optimised: the arms at the hold's first waypoint are solved as the still
   * problem of that waypoint (`instant`), started from a given configuration
   * first. A trajectory's hold waypoint is itself such a configuration, so a
   * hold with none has no trajectory, and the still problem of three waypoints
   * says so at a small fraction of what the whole trajectory's penalty ladder
   * costs to fail.
   *
   * @param problem The problem.
   * @param context Its context.
   * @param from Each arm's coordinates at each waypoint of a course, whose hold
   *   arm is the first start.
   * @returns The configuration found, each arm's coordinates at the hold's
   *   first waypoint, which `seed` of the same problem and context takes as its
   *   hold; none for a problem without a hold.
   * @throws {HumanRefusal} When no start gives the hold a feasible
   *   configuration, as `seed` refuses it.
   */
  export function held(
    problem: IProblem,
    context: M.IContext,
    from: readonly (readonly (readonly number[])[])[],
  ): number[][] | undefined {
    for (const k of holdWindow(problem, context))
      return instant(
        problem,
        context,
        k,
        from.map((arm: readonly (readonly number[])[]): number[] => [
          ...arm[k]!,
        ]),
      );
    return undefined;
  }
  /**
   * The arms' configuration at one waypoint of the hold with every hand on its
   * site and every arm clear, solved once from the caller's seed.
   */
  function instant(
    problem: IProblem,
    context: M.IContext,
    k: number,
    given?: number[][],
  ): number[][] {
    // The waypoint between its neighbours; the last one, where a hold lasts
    // to the end, with itself after it: a still configuration reads neither
    // end's time nor its arm.
    const around: number[] = [k - 1, k, Math.min(k + 1, context.n - 1)];
    const point: M.IContext = HumanArmTrajectoryContext.of({
      body: problem.body,
      times: around.map((j: number): number => problem.times[j]!),
      bases: around.map(
        (j: number): IProblem["bases"][number] => problem.bases[j]!,
      ),
      arms: problem.arms.map(
        (
          arm: IProblem["arms"][number],
        ): HumanArmTrajectoryContext.IProblem["arms"][number] => ({
          side: arm.side,
          rest: arm.rest,
          ...(arm.back === undefined ? {} : { back: arm.back }),
          ...(arm.rests === undefined ? {} : { rests: arm.rests }),
          ...(arm.grasp === undefined ? {} : { grasp: arm.grasp }),
          sites: around.map(
            (j: number): IProblem["arms"][number]["sites"][number] =>
              arm.sites[j],
          ),
        }),
      ),
      still: true,
    });
    // One attempt from the caller's seed, MoveIt's deterministic inverse
    // kinematics: a zero timeout limits the search to a single attempt
    // (`KDLKinematicsPlugin::searchPositionIK`, moveit/moveit
    // moveit_kinematics/kdl_kinematics_plugin/src/kdl_kinematics_plugin.cpp
    // line 280 at commit fdb79acafb24efd9e138b0d309fb2463186d4ab2,
    // BSD-3-Clause), MoveIt having no attempt count (MIGRATION.md, #1288);
    // the seed is the one the caller hands (`ik_seed_state`): a given
    // configuration, else the law's goal arm, else the current arm, the rest.
    function* starts(): Generator<number[][]> {
      if (given !== undefined)
        yield given.map((v: number[]): number[] => [...v]);
      else if (
        problem.arms.every(
          (arm: IProblem["arms"][number]): boolean => arm.guess !== undefined,
        )
      )
        yield problem.arms.map(
          (arm: IProblem["arms"][number], a: number): number[] =>
            G.encode(context.setups[a]!, arm.guess!),
        );
      else yield context.rest.map((v: number[]): number[] => [...v]);
    }
    const frame: (
      c: M.IContext,
      q: readonly (readonly number[])[],
    ) => number[][][] = (
      c: M.IContext,
      q: readonly (readonly number[])[],
    ): number[][][] =>
      q.map((v: readonly number[], a: number): number[][] =>
        Array.from({ length: c.n }, (_: unknown, k: number): number[] =>
          k === 0
            ? [...c.rest[a]!]
            : k === c.n - 1
              ? [...c.back[a]!]
              : M.ranged(c, a, v),
        ),
      );
    let closest: M.IEvaluation | undefined;
    for (const q of starts()) {
      const candidate: number[][][] = frame(point, q);
      if (M.evaluate(point, candidate).worst.value <= M.TOLERANCE)
        return candidate.map((arm: number[][]): number[] => arm[1]!);
      const at: IInstantAt = HumanArmOptimiser.optimise(point, candidate);
      if (at.evaluation.worst.value <= M.TOLERANCE)
        return at.x.map((arm: number[][]): number[] => arm[1]!);
      if (
        closest === undefined ||
        at.evaluation.worst.value < closest.worst.value
      )
        closest = at.evaluation;
    }
    throw new HumanRefusal({
      kind: "reach",
      axis: closest!.worst.axis,
      value: closest!.worst.value,
      feasible: null,
      reason: `no configuration of the ${problem.arms.map((arm: IProblem["arms"][number]): string => arm.side).join(" and ")} arm keeps the hand on its site and the arm clear at ${context.times[k]!.toFixed(3)} s, from its seed; the closest: ${closest!.worst.what}`,
      fix: "put the hand on a site its arm reaches with the body clear",
    });
  }

  /**
   * The hold's first configuration carried to its last waypoint: at each
   * waypoint one damped least-squares step of every arm
   * (`HumanArmDifferential.step`, the follower's map) toward its site, driven
   * by the error at that waypoint, the site less the contact where the arm
   * before puts it there, less the offset the inverse kinematics left at the
   * first (closed-loop inverse kinematics, Sciavicco and Siciliano 1988, IEEE J
   * Robot Autom 4:403), so a still site keeps the configuration, a moving one
   * is followed and no step's linearisation accumulates. Nothing is solved
   * here; the trajectory's optimiser keeps the hand on its site and the arm
   * clear.
   */
  function carried(
    context: M.IContext,
    start: number[][],
    first: number,
    last: number,
  ): number[][][] {
    const contact: (
      a: number,
      k: number,
      q: readonly number[],
      site: M.ISite,
    ) => IAutoMovieVector3 = (
      a: number,
      k: number,
      q: readonly number[],
      site: M.ISite,
    ): IAutoMovieVector3 => {
      const p: IAutoMovieMotionHumanArmGeometry.IPlaced = G.placed(
        context.setups[a]!,
        context.frames[a]![k]!,
        q,
        false,
      );
      return Vector3.add(
        p.wrist,
        Quaternion.rotateVector(p.hand, site.contact),
      );
    };
    const offsets: (IAutoMovieVector3 | undefined)[] = start.map(
      (q: number[], a: number): IAutoMovieVector3 | undefined => {
        const site: M.ISite | undefined = context.sites[a]![first];
        return site === undefined
          ? undefined
          : Vector3.subtract(site.point, contact(a, first, q, site));
      },
    );
    const out: number[][][] = [start];
    for (let k: number = first + 1; k <= last; ++k) {
      const previous: number[][] = out[out.length - 1]!;
      out.push(
        previous.map((q: number[], a: number): number[] => {
          const site: M.ISite | undefined = context.sites[a]![k];
          const offset: IAutoMovieVector3 | undefined = offsets[a];
          if (site === undefined || offset === undefined) return [...q];
          const error: IAutoMovieVector3 = Vector3.subtract(
            Vector3.subtract(site.point, contact(a, k, q, site)),
            offset,
          );
          const step: number[] = HumanArmDifferential.step(
            context.setups[a]!,
            context.frames[a]![k]!,
            q,
            site.contact,
            error,
          );
          // Kept in the hard ranges, as every iterate of the optimiser is.
          return M.ranged(
            context,
            a,
            q.map((v: number, d: number): number => v + step[d]!),
          );
        }),
      );
    }
    return out;
  }
}

/**
 * The waypoints inside the action at which every arm has a site, in order: the
 * hold the seed reaches, read for all arms together as the laid course reads
 * it.
 */
function holdWindow(
  problem: HumanArmSeed.IProblem,
  context: M.IContext,
): number[] {
  const out: number[] = [];
  for (let k: number = 1; k < context.n; ++k)
    if (
      M.inner(context, k) &&
      problem.arms.every(
        (arm: HumanArmSeed.IProblem["arms"][number]): boolean =>
          arm.sites[k] !== undefined,
      )
    )
      out.push(k);
  return out;
}
