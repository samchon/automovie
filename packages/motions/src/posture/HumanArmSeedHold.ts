import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import type { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmSeedContinuation } from "./HumanArmSeedContinuation";
import { HumanArmSeedInstant } from "./HumanArmSeedInstant";
import { HumanArmSeedRestarts } from "./HumanArmSeedRestarts";
import { HumanArmSeedStarts } from "./HumanArmSeedStarts";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/** The record of `IInstantAt`'s site. */
type IInstantAt = { x: number[][][]; evaluation: M.IEvaluation };
/**
 * The arms' configuration at one waypoint of the hold with every hand on its
 * site and every arm clear, solved once from the caller's seed.
 */ export function HumanArmSeedHold(
  problem: HumanArmSeed.IProblem,
  context: M.IContext,
  k: number,
  given?: number[][],
): number[][] {
  // The waypoint between its neighbours; the last one, where a hold lasts
  // to the end, with itself after it: a still configuration reads neither
  // end's time nor its arm.
  const around: number[] = [k - 1, k, Math.min(k + 1, context.n - 1)];
  // The instant's context, its sites the problem's own or, for a
  // continuation (`HumanArmSeedContinuation`), each arm's moved one.
  const pointAt = (moved?: (M.ISite | undefined)[]): M.IContext =>
    HumanArmSeedInstant(problem, around, moved);
  const point: M.IContext = pointAt();
  // One deterministic attempt from each seed the caller has, in turn: the
  // configuration it hands, the law's goal arm, the rest. MoveIt's KDL
  // inverse kinematics makes its first attempt from the caller's seed
  // (`ik_seed_state`) and, when that attempt fails, attempts again from
  // another seed until its timeout (`KDLKinematicsPlugin::searchPositionIK`,
  // moveit/moveit moveit_kinematics/kdl_kinematics_plugin/src/
  // kdl_kinematics_plugin.cpp, BSD-3-Clause); here the other seeds are the
  // caller's own, so the search stays deterministic. One start alone refused
  // holds another start clears (the karate stance transfer's last hold
  // instant, its hand 13.1 mm off its site from the carried start).

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
  // Restarts and the continuation run only where the site can be met at all:
  // a site farther from its shoulder than the arm and the contact reach, past
  // its disc, is refused at once, as no configuration meets it.
  point.sites.forEach(
    (sites: readonly (M.ISite | undefined)[], a: number): void => {
      const site: M.ISite | undefined = sites[1];
      if (site === undefined || site.on !== undefined) return;
      const shoulder: ReturnType<typeof G.placed>["shoulder"] = G.placed(
        point.setups[a]!,
        point.frames[a]![1]!,
        point.rest[a]!,
      ).shoulder;
      const reach: number =
        problem.body.measure.upperArm +
        problem.body.measure.forearm +
        Math.hypot(site.contact.x, site.contact.y, site.contact.z);
      const beyond: number =
        Math.hypot(
          site.point.x - shoulder.x,
          site.point.y - shoulder.y,
          site.point.z - shoulder.z,
        ) -
        reach -
        site.disc;
      if (beyond > 0)
        throw new HumanRefusal({
          kind: "reach",
          axis: "region",
          value: 1000 * beyond,
          feasible: null,
          reason: `the ${problem.arms[a]!.side} hand's site lies ${(1000 * beyond).toFixed(0)} mm beyond its arm's reach at ${context.times[k]!.toFixed(3)} s`,
          fix: "put the hand on a site its arm reaches",
        });
    },
  );
  let closest: M.IEvaluation | undefined;
  for (const q of [
    ...HumanArmSeedStarts(
      given,
      problem.arms.every(
        (arm: HumanArmSeed.IProblem["arms"][number]): boolean =>
          arm.guess !== undefined,
      )
        ? problem.arms.map(
            (arm: HumanArmSeed.IProblem["arms"][number], a: number): number[] =>
              G.encode(context.setups[a]!, arm.guess!),
          )
        : undefined,
      context.rest,
    ),
    ...HumanArmSeedRestarts(point),
  ]) {
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
  // A solution no restart reaches: the site walked in from the rest.
  const continued: number[][] | undefined = HumanArmSeedContinuation(
    point,
    point.rest,
    pointAt,
    (c: M.IContext, q: readonly (readonly number[])[]) => {
      const at: IInstantAt = HumanArmOptimiser.optimise(c, frame(c, q));
      return {
        x: at.x.map((arm: number[][]): number[] => arm[1]!),
        met: at.evaluation.worst.value <= M.TOLERANCE,
      };
    },
  );
  if (continued !== undefined) return continued;
  throw new HumanRefusal({
    kind: "reach",
    axis: closest!.worst.axis,
    value: closest!.worst.value,
    feasible: null,
    reason: `no configuration of the ${problem.arms.map((arm: HumanArmSeed.IProblem["arms"][number]): string => arm.side).join(" and ")} arm keeps the hand on its site and the arm clear at ${context.times[k]!.toFixed(3)} s, from its seed; the closest: ${closest!.worst.what}`,
    fix: "put the hand on a site its arm reaches with the body clear",
  });
}
