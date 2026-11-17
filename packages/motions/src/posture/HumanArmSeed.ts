import type { IAutoMovieMotionHumanArmClearance, IAutoMovieMotionHumanArmGeometry, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmConnect } from "./HumanArmConnect";
import { HumanArmDifferential } from "./HumanArmDifferential";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * The seed of an arms' trajectory, as a manipulation planner seeds its
 * optimiser (MoveIt's pipeline: a goal by inverse kinematics, a path to it by
 * a sampling planner, then trajectory optimisation, Schulman et al. 2014,
 * IJRR 33:1251, which starts from a collision-free path where a straight line
 * fails).
 *
 * The goal is the hold's first waypoint: the arms' configuration with every
 * hand on its site and every arm clear, solved as a still problem of that
 * one instant (`HumanArmTrajectoryModel`, its ends left out) from starts in
 * a fixed order, the goal's own arm, the rest arm, then configurations drawn
 * from a seeded generator within the ranges, the first feasible kept (random
 * restarts, Beeson and Ames 2015, "TRAC-IK", Humanoids). The hold's later
 * waypoints carry it by the sites' motion (differential inverse kinematics,
 * the map the follower uses), and the trajectory's optimiser solves them.
 * The reach is RRT-Connect's path in the arms' joint space, indexed by the
 * share of the reach, from the rest arms to the hold's first configuration
 * (`HumanArmConnect`), the return its path from the exit arms to the hold's
 * last, each state valid by the one reading the trajectory refuses by
 * (`HumanArmTrajectoryModel.invalid`) at the waypoint its share reaches, so
 * every state is read where it happens (time-indexed RRT-Connect, EXOTica). A
 * reach waypoint is the path's state at the share the carry has made at its
 * second.
 */
export namespace HumanArmSeed {
  /** What the seed reads. */
  export interface IProblem extends HumanArmTrajectoryContext.IProblem {
    /** The arms, each with the arm its inverse kinematics starts from first. */
    arms: readonly (HumanArmTrajectoryContext.IProblem["arms"][number] & {
      /** The arm the goal's own solution gives at the hold's start, the first start of its inverse kinematics. */
      guess?: IAutoMovieMotionHumanArmClearance.IArm;
    })[];
    /** The share of the reach made at a second of the reach, and of the return left at a second of the return, 0 at rest and 1 on the hold. */
    share: (seconds: number) => number;
  }

  /**
   * Each arm's coordinates at each waypoint.
   *
   * @param problem The problem.
   * @param context Its context.
   * @returns The seed.
   * @throws {HumanRefusal} When no start gives a feasible hold, or no path joins the rest arms to it.
   */
  export function seed(problem: IProblem, context: M.IContext): number[][][] {
    const n: number = context.n;
    const times: readonly number[] = context.times;
    const holds: number[] = [];
    for (let k: number = 1; k < n; ++k)
      if (M.inner(context, k) && problem.arms[0]!.sites[k] !== undefined)
        holds.push(k);
    const first: number = holds[0]!;
    const last: number = holds[holds.length - 1]!;
    const hold: number[][][] = goal(problem, context, first, last);
    const space: ISpace = sampler(context);
    // A path from an end of the action to the hold, through the waypoints
    // `passes` from that end's to the hold's: each configuration carries its
    // share of the reach (0 at rest, 1 on the hold) as its last coordinate,
    // and is valid where that share puts it, at the waypoint whose share is
    // nearest, so the rest arm is read where it rests and the hold where it
    // holds (time-indexed RRT-Connect, `HumanArmConnect`).
    const path = (
      from: number[][],
      to: number[][],
      passes: readonly number[],
    ): number[][] => {
      const k: number = passes[passes.length - 1]!;
      const shares: number[] = passes.map((j: number, i: number): number =>
        i === 0
          ? 0
          : i === passes.length - 1
            ? 1
            : Math.min(1, Math.max(0, problem.share(times[j]!))),
      );
      const dims: number = from.length * G.DIMENSIONS;
      const where: (s: number) => number = (s: number): number => {
        let best: number = 0;
        shares.forEach((v: number, i: number): void => {
          if (Math.abs(v - s) < Math.abs(shares[best]! - s)) best = i;
        });
        return passes[best]!;
      };
      const found: number[][] | null = HumanArmConnect.connect({
        start: [...from.flat(), 0],
        goal: [...to.flat(), 1],
        sample: (random: () => number): number[] => [
          ...space.sample(random),
          random(),
        ],
        valid: (q: readonly number[]): boolean =>
          M.invalid(context, where(q[dims]!), split(q.slice(0, dims))).value <=
          M.TOLERANCE,
        extent: space.extent,
        rising: dims,
      });
      if (found === null)
        throw new HumanRefusal({
          kind: "reach",
          axis: "region",
          value: M.invalid(context, passes[0]!, from).value,
          feasible: null,
          reason: `no clear path of the ${problem.arms.map((arm: IProblem["arms"][number]): string => arm.side).join(" and ")} arm joins its rest to its hold at ${times[k]!.toFixed(3)} s`,
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
    const reach: number[][] = path(context.rest, hold[0]!, span(0, first));
    // A hold that lasts to the end has no return to join.
    const back: number[][] = context.open
      ? []
      : path(context.back, hold[hold.length - 1]!, span(last, n - 1).reverse());
    return problem.arms.map(
      (_: IProblem["arms"][number], a: number): number[][] =>
        times.map((t: number, k: number): number[] => {
          if (k === 0) return [...context.rest[a]!];
          if (!M.inner(context, k)) return [...context.back[a]!];
          if (k >= first && k <= last) return [...hold[k - first]![a]!];
          const along: number[] = at(
            k < first ? reach : back,
            Math.min(1, Math.max(0, problem.share(t))),
          );
          return along.slice(a * G.DIMENSIONS, (a + 1) * G.DIMENSIONS);
        }),
    );
  }

  /**
   * The hold's configurations, each a list of the arms' coordinates: the
   * inverse kinematics of the hold's first waypoint, carried across the hold
   * by the sites' motion. The return's path and the optimiser need a valid
   * end, so a carried last configuration that is not clear is projected onto
   * the feasible set by the last waypoint's own inverse kinematics, started
   * from the carried configuration (the endpoint repair of a sampling
   * planner's goal).
   */
  function goal(
    problem: IProblem,
    context: M.IContext,
    first: number,
    last: number,
  ): number[][][] {
    const hold: number[][][] = carried(
      context,
      instant(problem, context, first),
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
   * The arms' configuration at one waypoint of the hold with every hand on
   * its site and every arm clear: the first feasible from the starts in
   * order, a given one, the goal's own arm, the rest arm, then the seeded
   * draws.
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
    const random: () => number = HumanArmConnect.generator(SEED);
    const space: ISpace = sampler(context);
    function* starts(): Generator<number[][]> {
      if (given !== undefined)
        yield given.map((v: number[]): number[] => [...v]);
      if (
        problem.arms.every(
          (arm: IProblem["arms"][number]): boolean => arm.guess !== undefined,
        )
      )
        yield problem.arms.map(
          (arm: IProblem["arms"][number], a: number): number[] =>
            G.encode(context.setups[a]!, arm.guess!),
        );
      yield context.rest.map((v: number[]): number[] => [...v]);
      for (let r: number = 0; r < RESTARTS; ++r)
        yield split(space.sample(random));
    }
    const frame = (
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
    let tried: number = 0;
    for (const q of starts()) {
      ++tried;
      const at: { x: number[][][]; evaluation: M.IEvaluation } =
        HumanArmOptimiser.optimise(point, frame(point, q));
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
      reason: `no configuration of the ${problem.arms.map((arm: IProblem["arms"][number]): string => arm.side).join(" and ")} arm keeps the hand on its site and the arm clear at ${context.times[k]!.toFixed(3)} s, from any of ${tried} starts; the closest: ${closest!.worst.what}`,
      fix: "put the hand on a site its arm reaches with the body clear",
    });
  }

  /**
   * The hold's first configuration carried to its last waypoint: at each
   * waypoint one damped least-squares step of every arm
   * (`HumanArmDifferential.step`, the follower's map) toward its site,
   * driven by the error at that waypoint, the site less the contact where
   * the arm before puts it there, less the offset the inverse kinematics left
   * at the first (closed-loop inverse kinematics, Sciavicco and Siciliano
   * 1988, IEEE J Robot Autom 4:403), so a still site keeps the configuration,
   * a moving one is followed and no step's linearisation accumulates. Nothing
   * is solved here; the trajectory's optimiser keeps the hand on its site
   * and the arm clear.
   */
  function carried(
    context: M.IContext,
    start: number[][],
    first: number,
    last: number,
  ): number[][][] {
    const contact = (
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

  /** A uniform draw of the arms' coordinates within their ranges, and the space's largest extent. */
  function sampler(c: M.IContext): ISpace {
    const radius: number[] = c.rest.map((rest: number[], a: number): number =>
      Math.max(
        G.SCALE,
        Math.hypot(rest[0]!, rest[1]!),
        Math.hypot(c.back[a]![0]!, c.back[a]![1]!),
      ),
    );
    let extent: number = 0;
    c.free.forEach((free: number[], a: number): void => {
      for (const d of free) {
        const b: [number, number] | null | undefined = c.bounds[a]![d];
        if (d < 2) extent += (2 * radius[a]!) ** 2;
        else if (b !== null && b !== undefined) extent += (b[1] - b[0]) ** 2;
      }
    });
    return {
      extent: Math.sqrt(extent),
      sample: (random: () => number): number[] =>
        c.rest.flatMap((rest: number[], a: number): number[] => {
          const out: number[] = [...rest];
          const free: number[] = c.free[a]!;
          if (free.includes(0) || free.includes(1)) {
            const r: number = radius[a]! * Math.sqrt(random());
            const theta: number = 2 * Math.PI * random();
            if (free.includes(0)) out[0] = r * Math.cos(theta);
            if (free.includes(1)) out[1] = r * Math.sin(theta);
          }
          for (const d of free) {
            const b: [number, number] | null | undefined = c.bounds[a]![d];
            if (d >= 2 && b !== null && b !== undefined)
              out[d] = b[0] + (b[1] - b[0]) * random();
          }
          return out;
        }),
    };
  }

  /** Each arm's coordinates from a concatenation. */
  function split(q: readonly number[]): number[][] {
    const out: number[][] = [];
    for (let i: number = 0; i < q.length; i += G.DIMENSIONS)
      out.push(q.slice(i, i + G.DIMENSIONS));
    return out;
  }

  /** The configuration of a path, without its share coordinate, where its share (its last coordinate, rising along it) reaches a value. */
  function at(path: readonly (readonly number[])[], share: number): number[] {
    const s: (q: readonly number[]) => number = (
      q: readonly number[],
    ): number => q[q.length - 1]!;
    for (let i: number = 1; i < path.length; ++i)
      if (share <= s(path[i]!) || i === path.length - 1) {
        const piece: number = s(path[i]!) - s(path[i - 1]!);
        return HumanArmConnect.lerp(
          path[i - 1]!,
          path[i]!,
          piece > 0
            ? Math.min(1, Math.max(0, (share - s(path[i - 1]!)) / piece))
            : 1,
        ).slice(0, -1);
      }
    return path[0]!.slice(0, -1);
  }
}

/** A uniform draw of the arms' coordinates within their ranges, and the space's largest extent, coordinate units. */
interface ISpace {
  sample: (random: () => number) => number[];
  extent: number;
}

/** Random starts of the hold's inverse kinematics after the goal's own arm and the rest arm. */
const RESTARTS: number = 8;

/** The restarts' generator's seed. */
const SEED: number = 2;
