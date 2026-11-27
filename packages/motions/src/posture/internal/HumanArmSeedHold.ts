import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
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
import { HumanArmWristShell } from "./HumanArmWristShell";

/*
 * The arms' configuration at one waypoint of the hold with every hand on its
 * site and every arm clear.
 * Parameter problem: The hold's problem.
 * Parameter context: The context prepared on the full knot set.
 * Parameter k: The hold's knot index.
 * Parameter given: The previous hold's coordinates or the caller's preferred seed.
 * Parameter proposed: The course's proposed coordinates at this knot.
 * Returns: Each arm's admitted coordinates.
 * When the reach bound or the inverse kinematics
 * refuses.
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
      const setup: IAutoMovieMotionHumanArmGeometry.ISetup = point.setups[a]!;
      const shoulder: IAutoMovieVector3 = G.chain(
        setup,
        point.frames[a]![1]!,
        point.rest[a]!,
      ).shoulder;
      const rest: IAutoMovieMotionHumanArmGeometry.ISetup["rest"] = setup.rest;
      const reach: number =
        AutoMovieEngineVector3.length(rest.lower.translation) +
        AutoMovieEngineVector3.length(rest.hand.translation) +
        AutoMovieEngineVector3.length(site.contact);
      const offset: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(site.point, shoulder);
      const normal: IAutoMovieVector3 | undefined = point.normals[a]![1];
      // The sum of link lengths bounds contact displacement on every
      // projection. A surface site only bounds the two tangent components.
      const required: number = AutoMovieEngineVector3.length(
        normal === undefined
          ? offset
          : AutoMovieEngineVector3.subtract(
              offset,
              AutoMovieEngineVector3.scale(normal, AutoMovieEngineVector3.dot(offset, normal)),
            ),
      );
      const radial: number =
        normal === undefined && AutoMovieEngineVector3.length(site.contact) === 0
          ? HumanArmWristShell(setup) - required
          : 0;
      const beyond: number =
        1000 * (Math.max(required - reach, radial) - site.disc);
      if (beyond > M.TOLERANCE)
        throw new AutoMovieMotionHumanRefusal({
          kind: "reach",
          axis: "region",
          value: beyond,
          feasible: null,
          reason: `the ${problem.arms[a]!.side} hand's site misses its arm's reachable region by ${beyond.toFixed(1)} mm at ${context.times[k]!.toFixed(3)} s`,
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
  const keep = (candidate: IInstantAt): void => {
    if (
      closest === undefined ||
      candidate.evaluation.worst.value < closest.evaluation.worst.value
    )
      closest = candidate;
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
    if (M.evaluate(anchored, candidate).worst.value <= M.TOLERANCE)
      return candidate.map((arm: number[][]): number[] => arm[1]!);
    const at: IInstantAt = hard(anchored, candidate);
    if (at.evaluation.worst.value <= M.TOLERANCE)
      return at.x.map((arm: number[][]): number[] => arm[1]!);
    keep(at);
    return undefined;
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
    for (const q of HumanArmContactConfigurations(branches))
      if (M.evaluate(point, frame(point, q)).worst.value <= M.TOLERANCE)
        return q;
  }
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
    if (exact.evaluation.worst.value <= M.TOLERANCE)
      return exact.x.map((arm: number[][]): number[] => arm[1]!);
    keep(exact);
  }
  // Give clearance an independent choice of the contact's exact coordinates
  // inside the authored disc. A failed search of this inscribed region does
  // not rule out the rest of the disc.
  if (point.sites.some((sites) => (sites[1]?.disc ?? 0) > 0)) {
    const exact: IInstantAt = hard(anchored, closest!.x, "region");
    if (exact.evaluation.worst.value <= M.TOLERANCE)
      return exact.x.map((arm: number[][]): number[] => arm[1]!);
    keep(exact);
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
          point: AutoMovieEngineVector3.add(site.point, AutoMovieEngineVector3.scale(axis, distance)),
          disc: 0,
        };
        const moved: M.IContext = pointAt(sites);
        const start: number[][][] = closest!.x;
        const exact: IInstantAt = hard(moved, start);
        if (
          exact.evaluation.worst.value <= M.TOLERANCE &&
          M.evaluate(point, exact.x).worst.value <= M.TOLERANCE
        )
          return exact.x.map((arm: number[][]): number[] => arm[1]!);
      }
  }
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
  throw new AutoMovieMotionHumanRefusal({
    kind: "reach",
    axis: closest!.evaluation.worst.axis,
    value: closest!.evaluation.worst.value,
    feasible: null,
    reason: `no configuration of the ${problem.arms.map((arm: HumanArmSeed.IProblem["arms"][number]): string => arm.side).join(" and ")} arm keeps the hand on its site and the arm clear at ${context.times[k]!.toFixed(3)} s, from its seed; the closest: ${closest!.evaluation.worst.what}`,
    fix: "put the hand on a site its arm reaches with the body clear",
  });
}
/*
 * The record of `IInstantAt`'s site.
 */
type IInstantAt = { x: number[][][]; evaluation: M.IEvaluation };

/*
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
    const delta: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      located.point,
      P.pad(placed[a]!, site.contact),
    );
    const normal: IAutoMovieVector3 | undefined = located.normal;
    const slide: IAutoMovieVector3 =
      nearest && normal !== undefined
        ? AutoMovieEngineVector3.subtract(
            delta,
            AutoMovieEngineVector3.scale(normal, AutoMovieEngineVector3.dot(delta, normal)),
          )
        : delta;
    const distance: number = AutoMovieEngineVector3.length(slide);
    if (distance === 0 || (nearest && distance <= site.disc)) return [...q];
    const displacement: IAutoMovieVector3 = nearest
      ? AutoMovieEngineVector3.scale(slide, (distance - site.disc) / distance)
      : slide;
    const step: number[] = HumanArmDifferential.step(
      c.setups[a]!,
      c.frames[a]![1]!,
      q,
      site.contact,
      displacement,
    );
    return M.ranged(
      c,
      a,
      q.map((v: number, d: number): number => v + step[d]!),
    );
  });
}
