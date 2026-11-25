import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmDifferential } from "./HumanArmDifferential";
import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import type { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmSeedContinuation } from "./HumanArmSeedContinuation";
import { HumanArmSeedInstant } from "./HumanArmSeedInstant";
import { HumanArmSeedRestarts } from "./HumanArmSeedRestarts";
import { HumanArmSeedStarts } from "./HumanArmSeedStarts";
import { HumanArmTrajectoryContactCircle } from "./HumanArmTrajectoryContactCircle";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";

/** The record of `IInstantAt`'s site. */
type IInstantAt = { x: number[][][]; evaluation: M.IEvaluation };
/**
 * The arms' configuration at one waypoint of the hold with every hand on its
 * site and every arm clear.
 *
 * @param problem The hold's problem.
 * @param context The context prepared on the full knot set.
 * @param k The hold's knot index.
 * @param given The previous hold's coordinates or the caller's preferred seed.
 * @param proposed The course's proposed coordinates at this knot.
 * @returns Each arm's admitted coordinates.
 * @throws {HumanRefusal} When the reach bound or the inverse kinematics refuses.
 */
export function HumanArmSeedHold(
  problem: HumanArmSeed.IProblem,
  context: M.IContext,
  k: number,
  given?: readonly (readonly number[])[],
  proposed?: readonly (readonly number[])[],
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
      const shoulder: IAutoMovieVector3 = G.chain(
        point.setups[a]!,
        point.frames[a]![1]!,
        point.rest[a]!,
      ).shoulder;
      const rest: IAutoMovieMotionHumanArmGeometry.ISetup["rest"] =
        point.setups[a]!.rest;
      const reach: number =
        Vector3.length(rest.lower.translation) +
        Vector3.length(rest.hand.translation) +
        Vector3.length(site.contact);
      const offset: IAutoMovieVector3 = Vector3.subtract(site.point, shoulder);
      const normal: IAutoMovieVector3 | undefined = point.normals[a]![1];
      // The sum of link lengths bounds contact displacement on every
      // projection. A surface site only bounds the two tangent components.
      const required: number = Vector3.length(
        normal === undefined
          ? offset
          : Vector3.subtract(
              offset,
              Vector3.scale(normal, Vector3.dot(offset, normal)),
            ),
      );
      const beyond: number = 1000 * (required - reach - site.disc);
      if (beyond > M.TOLERANCE)
        throw new HumanRefusal({
          kind: "reach",
          axis: "region",
          value: beyond,
          feasible: null,
          reason: `the ${problem.arms[a]!.side} hand's site lies ${beyond.toFixed(0)} mm beyond its arm's reach at ${context.times[k]!.toFixed(3)} s`,
          fix: "put the hand on a site its arm reaches",
        });
    },
  );
  // A carried pose within the site disc can still leave a staircase of pose
  // jumps as the target moves. Predict this knot from its target displacement
  // before testing the carried or authored poses (Wampler 1986).
  const predicted: number[][] | undefined =
    given === undefined ? undefined : follow(point, given);
  const anchored: M.IContext =
    predicted === undefined ? point : { ...point, anchor: predicted };
  let closest: M.IWorst | undefined;
  if (given !== undefined) {
    // A locally valid hold can lie on the other side of an obstacle from its
    // predecessor. The analytic swivel follows the preceding branch and reads
    // its approach sweep before considering a different local IK solution.
    const continued: (number[] | undefined)[] = given.map(
      (arm: readonly number[], a: number): number[] | undefined =>
        context.sites[a]![k] === undefined
          ? [...arm]
          : HumanArmTrajectoryContactCircle(context, a, k, arm, k - 1)[0],
    );
    if (continued.every((arm): boolean => arm !== undefined)) {
      const joined: number[][] = continued.map((arm): number[] => arm!);
      if (M.evaluate(point, frame(point, joined)).worst.value <= M.TOLERANCE)
        return joined;
    }
  }
  const starts: number[][][] = HumanArmSeedStarts(
    predicted,
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
  );
  if (proposed !== undefined)
    starts.splice(
      predicted === undefined ? 0 : 1,
      0,
      proposed.map((arm: readonly number[]): number[] => [...arm]),
    );
  const hard = (c: M.IContext, scenario: number[][][]): IInstantAt =>
    HumanArmOptimiser.optimise(
      c,
      scenario,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    );
  const attempt = (q: readonly (readonly number[])[]): number[][] | undefined => {
    const candidate: number[][][] = frame(point, q);
    if (M.evaluate(anchored, candidate).worst.value <= M.TOLERANCE)
      return candidate.map((arm: number[][]): number[] => arm[1]!);
    const at: IInstantAt = hard(anchored, candidate);
    if (at.evaluation.worst.value <= M.TOLERANCE)
      return at.x.map((arm: number[][]): number[] => arm[1]!);
    if (closest === undefined || at.evaluation.worst.value < closest.value)
      closest = at.evaluation.worst;
    return undefined;
  };
  for (const q of starts) {
    const admitted: number[][] | undefined = attempt(q);
    if (admitted !== undefined) return admitted;
  }
  // If the nearest projection pins a contact against an obstacle, use the
  // elastic TrajOpt step to find a different starting contact within the
  // authored region. Only a subsequent equality-constrained solve can admit
  // it (Schulman et al. 2014, set of initializations in section VIII-A).
  const predictedContact: IInstantAt = HumanArmOptimiser.optimise(
    anchored,
    frame(point, starts[0]!),
  );
  const exact: IInstantAt = hard(anchored, predictedContact.x);
  if (exact.evaluation.worst.value <= M.TOLERANCE)
    return exact.x.map((arm: number[][]): number[] => arm[1]!);
  if (closest === undefined || exact.evaluation.worst.value < closest.value)
    closest = exact.evaluation.worst;
  // A narrow basin can be reached by continuation from the current branch
  // before widening the search to dispersed configurations.
  const start: readonly (readonly number[])[] = given ?? proposed ?? point.rest;
  const continued: number[][] | undefined = HumanArmSeedContinuation(
    point,
    start,
    pointAt,
    (c: M.IContext, q: readonly (readonly number[])[]) => {
      const at: IInstantAt = hard(c, frame(c, q));
      return {
        x: at.x.map((arm: number[][]): number[] => arm[1]!),
        met: at.evaluation.worst.value <= M.TOLERANCE,
      };
    },
  );
  if (continued !== undefined) return continued;
  for (const q of HumanArmSeedRestarts(point)) {
    const admitted: number[][] | undefined = attempt(q);
    if (admitted !== undefined) return admitted;
  }
  throw new HumanRefusal({
    kind: "reach",
    axis: closest!.axis,
    value: closest!.value,
    feasible: null,
    reason: `no configuration of the ${problem.arms.map((arm: HumanArmSeed.IProblem["arms"][number]): string => arm.side).join(" and ")} arm keeps the hand on its site and the arm clear at ${context.times[k]!.toFixed(3)} s, from its seed; the closest: ${closest!.what}`,
    fix: "put the hand on a site its arm reaches with the body clear",
  });
}

/**
 * Predict the next hold pose using the site and the carried pose in this
 * knot's frames. A riding site is read from the other arm in the same pose.
 */
function follow(
  c: M.IContext,
  previous: readonly (readonly number[])[],
): number[][] {
  const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[] = previous.map(
    (q: readonly number[], a: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
      G.placed(c.setups[a]!, c.frames[a]![1]!, q, false),
  );
  return previous.map((q: readonly number[], a: number): number[] => {
    const site: M.ISite | undefined = c.sites[a]![1];
    if (site === undefined) return [...q];
    const located: P.ILocated = P.located(
      c,
      (b: number): IAutoMovieMotionHumanArmGeometry.IPlaced => placed[b]!,
      a,
      1,
      site,
    );
    const step: number[] = HumanArmDifferential.step(
      c.setups[a]!,
      c.frames[a]![1]!,
      q,
      site.contact,
      Vector3.subtract(located.point, P.pad(placed[a]!, site.contact)),
    );
    return M.ranged(c, a, q.map((v: number, d: number): number => v + step[d]!));
  });
}
