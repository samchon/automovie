import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanArmClearance } from "./HumanArmClearance";
import { HumanArmConnect } from "./HumanArmConnect";
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
 * The goal is the hold: the arms' configuration with every hand on its site
 * and every arm clear, solved as a still problem (`HumanArmTrajectoryModel`,
 * its ends left out) from starts in a fixed order, the goal's own arm, the
 * rest arm, then configurations drawn from a seeded generator within the
 * ranges, the first feasible kept (random restarts, Beeson and Ames 2015,
 * "TRAC-IK", Humanoids). The reach is RRT-Connect's path in the arms' joint
 * space from the rest arms to the hold's first configuration
 * (`HumanArmConnect`), the return its path from the exit arms to the hold's
 * last, each valid by the one reading the trajectory refuses by
 * (`HumanArmTrajectoryModel.invalid`). A reach waypoint lies along its path
 * by the share of the reach the carry has made at its second.
 */
export namespace HumanArmSeed {
  /** What the seed reads. */
  export interface IProblem extends HumanArmTrajectoryContext.IProblem {
    /** The arms, each with the arm its inverse kinematics starts from first. */
    arms: readonly (HumanArmTrajectoryContext.IProblem["arms"][number] & {
      /** The arm the goal's own solution gives at the hold's start, the first start of its inverse kinematics. */
      guess?: HumanArmClearance.IArm;
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
    for (let k: number = 1; k + 1 < n; ++k) if (problem.arms[0]!.sites[k] !== undefined) holds.push(k);
    const first: number = holds[0]!;
    const last: number = holds[holds.length - 1]!;
    const hold: number[][][] = goal(problem, context, first, last);
    const space: ISpace = sampler(context);
    const path = (from: number[][], to: number[][], k: number): number[][] => {
      const found: number[][] | null = HumanArmConnect.connect({
        start: from.flat(),
        goal: to.flat(),
        sample: space.sample,
        valid: (q: readonly number[]): boolean => M.invalid(context, k, split(q)).value <= M.TOLERANCE,
        extent: space.extent,
      });
      if (found === null)
        throw new HumanRefusal({
          kind: "reach",
          axis: "region",
          value: M.invalid(context, k, from).value,
          feasible: null,
          reason: `no clear path of the ${problem.arms.map((arm: IProblem["arms"][number]): string => arm.side).join(" and ")} arm joins its rest to its hold at ${times[k]!.toFixed(3)} s`,
          fix: "put the hand on a site its arm reaches with the body clear",
        });
      return found;
    };
    const reach: number[][] = path(context.rest, hold[0]!, first);
    const back: number[][] = path(context.back, hold[hold.length - 1]!, last);
    return problem.arms.map((_: IProblem["arms"][number], a: number): number[][] =>
      times.map((t: number, k: number): number[] => {
        if (k === 0) return [...context.rest[a]!];
        if (k === n - 1) return [...context.back[a]!];
        if (k >= first && k <= last) return [...hold[k - first]![a]!];
        const along: number[] = at(k < first ? reach : back, Math.min(1, Math.max(0, problem.share(t))));
        return along.slice(a * G.DIMENSIONS, (a + 1) * G.DIMENSIONS);
      }),
    );
  }

  /** The hold's configurations, each a list of the arms' coordinates: the first feasible from the starts in order. */
  function goal(problem: IProblem, context: M.IContext, first: number, last: number): number[][][] {
    const span = (from: number, to: number): M.IContext =>
      HumanArmTrajectoryContext.of({
        body: problem.body,
        times: problem.times.slice(from - 1, to + 2),
        bases: problem.bases.slice(from - 1, to + 2),
        arms: problem.arms.map((arm: IProblem["arms"][number]): HumanArmTrajectoryContext.IProblem["arms"][number] => ({
          side: arm.side,
          rest: arm.rest,
          ...(arm.back === undefined ? {} : { back: arm.back }),
          ...(arm.rests === undefined ? {} : { rests: arm.rests }),
          sites: arm.sites.slice(from - 1, to + 2),
        })),
        still: true,
      });
    const point: M.IContext = span(first, first);
    const whole: M.IContext = span(first, last);
    const random: () => number = HumanArmConnect.generator(SEED);
    const space: ISpace = sampler(context);
    function* starts(): Generator<number[][]> {
      if (problem.arms.every((arm: IProblem["arms"][number]): boolean => arm.guess !== undefined))
        yield problem.arms.map((arm: IProblem["arms"][number], a: number): number[] => G.encode(context.setups[a]!, arm.guess!));
      yield context.rest.map((v: number[]): number[] => [...v]);
      for (let r: number = 0; r < RESTARTS; ++r) yield split(space.sample(random));
    }
    const frame = (c: M.IContext, q: readonly (readonly number[])[]): number[][][] =>
      q.map((v: readonly number[], a: number): number[][] =>
        Array.from({ length: c.n }, (_: unknown, k: number): number[] =>
          k === 0 ? [...c.rest[a]!] : k === c.n - 1 ? [...c.back[a]!] : [...v],
        ),
      );
    let closest: M.IEvaluation | undefined;
    for (const q of starts()) {
      const at: { x: number[][][]; evaluation: M.IEvaluation } = HumanArmOptimiser.optimise(point, frame(point, q));
      if (at.evaluation.worst.value <= M.TOLERANCE) {
        const held: { x: number[][][]; evaluation: M.IEvaluation } = HumanArmOptimiser.optimise(whole, frame(whole, at.x.map((arm: number[][]): number[] => arm[1]!)));
        if (held.evaluation.worst.value <= M.TOLERANCE)
          return Array.from({ length: last - first + 1 }, (_: unknown, i: number): number[][] => held.x.map((arm: number[][]): number[] => arm[i + 1]!));
        if (closest === undefined || held.evaluation.worst.value < closest.worst.value) closest = held.evaluation;
      } else if (closest === undefined || at.evaluation.worst.value < closest.worst.value) closest = at.evaluation;
    }
    throw new HumanRefusal({
      kind: "reach",
      axis: closest!.worst.axis,
      value: closest!.worst.value,
      feasible: null,
      reason: `no hold of the ${problem.arms.map((arm: IProblem["arms"][number]): string => arm.side).join(" and ")} arm keeps the hand on its site and the arm clear, from any of ${RESTARTS + 2} starts; the closest: ${closest!.worst.what}`,
      fix: "put the hand on a site its arm reaches with the body clear",
    });
  }

  /** A uniform draw of the arms' coordinates within their ranges, and the space's largest extent. */
  function sampler(c: M.IContext): ISpace {
    const radius: number[] = c.rest.map((rest: number[], a: number): number =>
      Math.max(G.SCALE, Math.hypot(rest[0]!, rest[1]!), Math.hypot(c.back[a]![0]!, c.back[a]![1]!)),
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
            if (d >= 2 && b !== null && b !== undefined) out[d] = b[0] + (b[1] - b[0]) * random();
          }
          return out;
        }),
    };
  }

  /** Each arm's coordinates from a concatenation. */
  function split(q: readonly number[]): number[][] {
    const out: number[][] = [];
    for (let i: number = 0; i < q.length; i += G.DIMENSIONS) out.push(q.slice(i, i + G.DIMENSIONS));
    return out;
  }

  /** The configuration a share of a path's length along it. */
  function at(path: readonly (readonly number[])[], share: number): number[] {
    const lengths: number[] = [0];
    for (let i: number = 1; i < path.length; ++i)
      lengths.push(lengths[i - 1]! + HumanArmConnect.distance(path[i - 1]!, path[i]!));
    const target: number = share * lengths[lengths.length - 1]!;
    for (let i: number = 1; i < path.length; ++i)
      if (target <= lengths[i]! || i === path.length - 1) {
        const piece: number = lengths[i]! - lengths[i - 1]!;
        return HumanArmConnect.lerp(path[i - 1]!, path[i]!, piece > 0 ? Math.min(1, (target - lengths[i - 1]!) / piece) : 1);
      }
    return [...path[0]!];
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
