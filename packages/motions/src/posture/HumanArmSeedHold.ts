import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmContactConfigurations } from "./HumanArmContactConfigurations";
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
 * @param joins Whether the static pose joins its settled adjacent grid poses.
 * @returns Each arm's admitted coordinates.
 * @throws {HumanRefusal} When the reach bound or the inverse kinematics
 *   refuses.
 */
export function HumanArmSeedHold(
  problem: HumanArmSeed.IProblem,
  context: M.IContext,
  k: number,
  given?: readonly (readonly number[])[],
  proposed?: readonly (readonly number[])[],
  joins?: (
    pose: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
  ) => boolean,
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
  let closest: IInstantAt | undefined;
  let fallback: number[][] | undefined;
  const keep = (candidate: IInstantAt): void => {
    if (
      closest === undefined ||
      candidate.evaluation.worst.value < closest.evaluation.worst.value
    )
      closest = candidate;
  };
  const choose = (candidate: IInstantAt): number[][] | undefined => {
    keep(candidate);
    if (candidate.evaluation.worst.value > M.TOLERANCE) return undefined;
    const q: number[][] = candidate.x.map((arm) => arm[1]!);
    if (
      joins === undefined ||
      joins(candidate.evaluation.placed.map((arm) => arm[1]!))
    )
      return q;
    // Keep the exact static candidate available to the trajectory solve if
    // none of the local swivel alternatives clears the adjacent sweep.
    if (fallback === undefined) fallback = q;
    return undefined;
  };
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
      const x: number[][][] = frame(point, joined);
      const admitted: number[][] | undefined = choose({
        x,
        evaluation: M.evaluate(point, x),
      });
      if (admitted !== undefined) return admitted;
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
      follow(point, proposed, true),
      proposed.map((arm: readonly number[]): number[] => [...arm]),
    );
  const hard = (
    c: M.IContext,
    scenario: number[][][],
    contact: true | "region" = true,
  ): IInstantAt =>
    HumanArmOptimiser.optimise(
      c,
      scenario,
      undefined,
      undefined,
      undefined,
      undefined,
      contact,
    );
  const attempt = (
    q: readonly (readonly number[])[],
  ): number[][] | undefined => {
    const candidate: number[][][] = frame(point, q);
    const evaluation: M.IEvaluation = M.evaluate(anchored, candidate);
    return choose(
      evaluation.worst.value <= M.TOLERANCE
        ? { x: candidate, evaluation }
        : hard(anchored, candidate),
    );
  };
  for (const q of starts) {
    const admitted: number[][] | undefined = attempt(q);
    if (admitted !== undefined) return admitted;
  }
  // A local solve can be on the wrong side of an obstacle even where it has
  // the contact. Read the distinct clear swivel components before the
  // dispersed starts. Check each joint configuration for cross-arm clearance.
  for (const reference of starts) {
    const branches: number[][][] = reference.map(
      (q: number[], a: number): number[][] => {
        const site: M.ISite | undefined = point.sites[a]![1];
        return site === undefined || site.on !== undefined
          ? [q]
          : HumanArmTrajectoryContactCircle(point, a, 1, q);
      },
    );
    for (const q of HumanArmContactConfigurations(branches)) {
      const x: number[][][] = frame(point, q);
      const admitted: number[][] | undefined = choose({
        x,
        evaluation: M.evaluate(point, x),
      });
      if (admitted !== undefined) return admitted;
    }
  }
  if (fallback !== undefined) return fallback;
  // If the nearest projection pins a contact against an obstacle, use the
  // elastic TrajOpt step to find a different starting contact within the
  // authored region. Only a subsequent equality-constrained solve can admit
  // it (Schulman et al. 2014, set of initializations in section VIII-A).
  for (const q of starts) {
    const predictedContact: IInstantAt = HumanArmOptimiser.optimise(
      anchored,
      frame(point, q),
    );
    const exact: IInstantAt = hard(anchored, predictedContact.x);
    const admitted: number[][] | undefined = choose(exact);
    if (admitted !== undefined) return admitted;
  }
  // Give clearance an independent choice of the contact's exact coordinates
  // inside the authored disc. A failed search of this inscribed region does
  // not rule out the rest of the disc.
  if (point.sites.some((sites) => (sites[1]?.disc ?? 0) > 0)) {
    const exact: IInstantAt = hard(anchored, closest!.x, "region");
    const admitted: number[][] | undefined = choose(exact);
    if (admitted !== undefined) return admitted;
  }
  // Test contacts at the ends of the disc's tangent diameters when the
  // nearest projection cannot clear. Each alternative fixes its own point
  // exactly. Test the result against the original surface and all sites.
  const chosen: (M.ISite | undefined)[] = point.sites.map(
    (sites: readonly (M.ISite | undefined)[]): M.ISite | undefined => sites[1],
  );
  for (let a: number = 0; a < chosen.length; ++a) {
    const site: M.ISite | undefined = chosen[a];
    const normal: IAutoMovieVector3 | undefined = point.normals[a]![1];
    if (site === undefined || site.on !== undefined || site.disc === 0)
      continue;
    for (const axis of normal === undefined ? P.AXES : P.tangents(normal))
      for (const distance of [-site.disc, site.disc]) {
        const sites: (M.ISite | undefined)[] = [...chosen];
        sites[a] = {
          ...site,
          point: Vector3.add(site.point, Vector3.scale(axis, distance)),
          disc: 0,
        };
        const moved: M.IContext = pointAt(sites);
        const start: number[][][] = closest!.x;
        const exact: IInstantAt = hard(moved, start);
        if (exact.evaluation.worst.value <= M.TOLERANCE) {
          const admitted: number[][] | undefined = choose({
            x: exact.x,
            evaluation: M.evaluate(point, exact.x),
          });
          if (admitted !== undefined) return admitted;
        }
      }
  }
  if (fallback !== undefined) return fallback;
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
  if (continued !== undefined) {
    const x: number[][][] = frame(point, continued);
    const admitted: number[][] | undefined = choose({
      x,
      evaluation: M.evaluate(point, x),
    });
    if (admitted !== undefined) return admitted;
  }
  for (const q of HumanArmSeedRestarts(point)) {
    const admitted: number[][] | undefined = attempt(q);
    if (admitted !== undefined) return admitted;
  }
  if (fallback !== undefined) return fallback;
  throw new HumanRefusal({
    kind: "reach",
    axis: closest!.evaluation.worst.axis,
    value: closest!.evaluation.worst.value,
    feasible: null,
    reason: `no configuration of the ${problem.arms.map((arm: HumanArmSeed.IProblem["arms"][number]): string => arm.side).join(" and ")} arm keeps the hand on its site and the arm clear at ${context.times[k]!.toFixed(3)} s, from its seed; the closest: ${closest!.evaluation.worst.what}`,
    fix: "put the hand on a site its arm reaches with the body clear",
  });
}

/**
 * Predict the next hold pose using the site and the carried pose in this knot's
 * frames. A riding site is read from the other arm in the same pose. Correct a
 * proposed pose towards the nearest region point so a nearly admitted contact
 * moves only by its residual.
 */
function follow(
  c: M.IContext,
  previous: readonly (readonly number[])[],
  nearest: boolean = false,
): number[][] {
  const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[] = previous.map(
    (
      q: readonly number[],
      a: number,
    ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
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
    const delta: IAutoMovieVector3 = Vector3.subtract(
      located.point,
      P.pad(placed[a]!, site.contact),
    );
    const normal: IAutoMovieVector3 | undefined = located.normal;
    const slide: IAutoMovieVector3 =
      nearest && normal !== undefined
        ? Vector3.subtract(
            delta,
            Vector3.scale(normal, Vector3.dot(delta, normal)),
          )
        : delta;
    const distance: number = Vector3.length(slide);
    if (distance === 0 || (nearest && distance <= site.disc)) return [...q];
    const displacement: IAutoMovieVector3 = nearest
      ? Vector3.scale(slide, (distance - site.disc) / distance)
      : slide;
    const setup: IAutoMovieMotionHumanArmGeometry.ISetup = c.setups[a]!;
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![1]!;
    const target: IAutoMovieVector3 = Vector3.add(
      P.pad(placed[a]!, site.contact),
      displacement,
    );
    const blocked: Set<number> = new Set();
    let angles: readonly number[] = q;
    let residual: IAutoMovieVector3 = displacement;
    for (;;) {
      const step: number[] = HumanArmDifferential.step(
        setup,
        frame,
        angles,
        site.contact,
        residual,
        blocked,
      );
      const trial: number[] = angles.map(
        (v: number, d: number): number => v + step[d]!,
      );
      const ranged: number[] = M.ranged(c, a, trial);
      if (!nearest) return ranged;
      // Reallocate correction lost to active bounds among the remaining
      // free joints. Each repeat fixes at least one new coordinate, so the
      // operation ends when the active set stops changing.
      const size: number = blocked.size;
      for (const d of c.free[a]!) if (trial[d] !== ranged[d]) blocked.add(d);
      if (blocked.size === size) return ranged;
      residual = Vector3.subtract(
        target,
        P.pad(G.chain(setup, frame, ranged), site.contact),
      );
      if (Vector3.length(residual) <= M.TOLERANCE / 1000) return ranged;
      angles = ranged;
    }
  });
}
