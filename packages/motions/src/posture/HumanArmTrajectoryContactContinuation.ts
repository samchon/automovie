import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMotionHumanArmClearance, IAutoMovieMotionHumanArmGeometry, IAutoMovieVector3 } from "@automovie/interface";

import { HumanArmDifferential } from "./HumanArmDifferential";
import { HumanArmGeometry } from "./HumanArmGeometry";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryContactCircle } from "./HumanArmTrajectoryContactCircle";
import { HumanArmTrajectoryLaid } from "./HumanArmTrajectoryLaid";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryMirror } from "./HumanArmTrajectoryMirror";
import { HumanArmTrajectoryPairs } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel } from "./HumanArmTrajectoryTravel";

/**
 * Trace each feasible endpoint swivel component towards an admitted hold in
 * both time directions. Uses the original course's physical limits, including
 * its time-dependent pace, for the final whole-course admission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the source boundary and retained physical admission.
 * @evidence contracts/development/implementation.md#principled-implementation Each new contact pose continues its neighbour's actual elbow-to-contact circle and the resulting splices are admitted on the native full frame grid.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Trace the endpoint components into the longest admitted interval, select a low-speed admissible join, then admit the entire course on the original clock.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every rig, site, crossing, sweep, range and speed constraint remains active; a failed alternative returns the original course.
 * @evidence contracts/development/implementation.md#efficient-algorithms A linear scan finds the admitted interval. Each endpoint component advances until a safe join introduces no speed peak, the branch loses feasibility, or the opposite boundary is reached.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the original per-time placement context and admitted hold coordinates. The interval contexts serve all terminal components and untouched original coordinates are borrowed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate coordinates and contexts are local to the course call.
 */
export function HumanArmTrajectoryContactContinuation(
  problem: HumanArmTrajectory.IProblem,
  held: readonly number[],
  course: HumanArmTrajectoryLaid.IAdmitted,
  stretches: boolean,
  tempo?: number,
): HumanArmTrajectoryLaid.IAdmitted {
  const previous: M.IEvaluation | undefined = course.read.evaluation;
  if (course.admitted || previous === undefined) return course;
  const c: M.IContext = course.read.context;
  let first: number = 0;
  let length: number = 0;
  let run: number = 0;
  for (const k of held) {
    run = previous.failing[k] ? 0 : run + 1;
    if (run > length) {
      first = k - run + 1;
      length = run;
    }
  }
  if (length === 0 || length === held.length) return course;
  const x: number[][][] = course.read.x.map((arm: number[][]): number[][] => [...arm]);
  const canonical: HumanArmTrajectory.IProblem = HumanArmTrajectoryMirror.leftFirst(problem)
    ? HumanArmTrajectoryMirror.mirrored(problem) : problem;
  // Retain the original geometry and allowances at each physical instant.
  const subcontext = (frames: readonly number[], still: boolean): M.IContext => course.read.of({
    ...canonical,
    still,
    times: frames.map((i: number): number => c.times[i]!),
    bases: frames.map((i: number) => canonical.bases[i]!),
    arms: canonical.arms.map((arm: HumanArmTrajectory.IArm): HumanArmTrajectory.IArm => ({ ...arm, sites: frames.map((i: number) => arm.sites[i]) })),
  }, c);
  const follow = (boundary: number, terminal: number, other: number): number | undefined => {
    if (boundary === terminal) return boundary;
    const direction: number = Math.sign(boundary - terminal);
    const point: M.IContext = subcontext([Math.max(0, terminal - 1), terminal, Math.min(c.n - 1, terminal + 1)], true);
    const members: number[][][] = [];
    for (let a: number = 0; a < x.length; ++a) {
      const choices: number[][] = [];
      for (const reference of [x[a]![boundary]!, x[a]![terminal]!, c.rest[a]!]) {
        for (const q of HumanArmTrajectoryContactCircle(c, a, terminal, reference))
          if (!choices.some((known: number[]): boolean => known.every((v: number, d: number): boolean => v === q[d])))
            choices.push(q);
      }
      if (choices.length === 0) return undefined;
      members.push(choices);
    }
    const intervals: Map<number, M.IContext> = new Map();
    const interval = (k: number): M.IContext => {
      const known: M.IContext | undefined = intervals.get(k);
      if (known !== undefined) return known;
      const from: number = k - direction;
      const local: M.IContext = subcontext([from, k], false);
      local.times = [0, Math.abs(c.times[k]! - c.times[from]!)];
      local.speed = (): number => c.speed((c.times[k]! + c.times[from]!) / 2);
      intervals.set(k, local);
      return local;
    };
    // Each disconnected component gets an independent continuation.
    for (const end of configurations(members)) {
      const at: number[][][] = end.map((q: number[], a: number): number[][] => [point.rest[a]!, q, point.back[a]!]);
      if (M.evaluate(point, at).worst.value > M.TOLERANCE) continue;
      const path: number[][][] = end.map((q: number[]): number[][] => [q]);
      let join: number | undefined;
      let best: number = Infinity;
      let approach: number = 0;
      for (let k: number = terminal + direction; direction * (k - other) <= 0; k += direction) {
        const from: number = k - direction;
        const local: M.IContext = interval(k);
        const last: number[][] = path.map((arm: number[][]): number[] => arm[arm.length - 1]!);
        const joined: number[][][] = last.map((q: number[], a: number): number[][] => [q, x[a]![k]!]);
        if (direction * (k - boundary) >= 0) {
          const meeting: M.IEvaluation = M.evaluate(local, joined);
          if (meeting.worst.value <= M.TOLERANCE) {
            const speed: number = fastest(c, from, k, meeting.placed);
            if (speed < best) {
              best = speed;
              join = k;
            }
            // A join no faster than either adjacent natural step introduces
            // no new speed peak. Otherwise keep searching the admitted span
            // for the lowest-speed admissible seam.
            const next: number = k + direction;
            const departure: number = next >= 0 && next < c.n
              ? fastest(c, k, next, previous.placed.map((arm: IAutoMovieMotionHumanArmGeometry.IPlaced[]): IAutoMovieMotionHumanArmGeometry.IPlaced[] => [arm[k]!, arm[next]!]))
              : 0;
            if (speed <= Math.max(approach, departure)) break;
          }
        }
        const seed: number[][][] = last.map((q: number[], a: number): number[][] => {
          const circle: number[] | undefined = HumanArmTrajectoryContactCircle(c, a, k, q, from)[0];
          if (circle !== undefined) return [q, circle];
          const site: M.ISite | undefined = c.sites[a]![k];
          if (site === undefined || site.on !== undefined) return [q, x[a]![k]!];
          const placed: ReturnType<typeof HumanArmGeometry.placed> = HumanArmGeometry.placed(c.setups[a]!, c.frames[a]![k]!, q, false);
          const error: IAutoMovieVector3 = Vector3.subtract(site.point, HumanArmTrajectoryPairs.pad(placed, site.contact));
          const step: number[] = HumanArmDifferential.step(c.setups[a]!, c.frames[a]![k]!, q, site.contact, error);
          return [q, M.ranged(c, a, q.map((v: number, d: number): number => v + step[d]!))];
        });
        let tracked: number[][][] = seed;
        let measured: M.IEvaluation = M.evaluate(local, seed);
        if (measured.worst.value > M.TOLERANCE) {
          const fit: ReturnType<typeof HumanArmOptimiser.optimise> = HumanArmOptimiser.optimise(local, seed);
          if (fit.evaluation.worst.value > M.TOLERANCE) break;
          tracked = fit.x;
          measured = fit.evaluation;
        }
        approach = fastest(c, from, k, measured.placed);
        tracked.forEach((arm: number[][], a: number): void => { path[a]!.push(arm[1]!); });
      }
      if (join !== undefined) {
        const count: number = Math.abs(join - terminal);
        path.forEach((arm: number[][], a: number): void => {
          for (let j: number = 0; j < count; ++j)
            x[a]![terminal + j * direction] = arm[j]!;
        });
        return join;
      }
    }
    return undefined;
  };
  const last: number = first + length - 1;
  const joined: number | undefined = follow(first, held[0]!, last);
  if (joined === undefined || follow(last, held[held.length - 1]!, joined) === undefined)
    return course;
  const candidate: HumanArmTrajectoryLaid.IAdmitted = HumanArmTrajectoryLaid.admitted(
    problem,
    x.map((arm: number[][], a: number) => arm.map((q: number[], k: number): IAutoMovieMotionHumanArmClearance.IArm | undefined =>
      k >= held[0]! && k <= held[held.length - 1]! ? HumanArmGeometry.arm(c.setups[a]!, q) : undefined)),
    stretches,
    tempo,
    c.speed,
  );
  return candidate.admitted ? candidate : course;
}

/** Joint terminal configurations, produced on demand in arm order. */
function* configurations(
  choices: readonly number[][][],
  prefix: readonly number[][] = [],
): Generator<number[][]> {
  if (prefix.length === choices.length) {
    yield [...prefix];
    return;
  }
  for (const arm of choices[prefix.length]!)
    yield* configurations(choices, [...prefix, arm]);
}

/** Peak native probe speed across one tested transition in either direction. */
function fastest(
  c: M.IContext,
  from: number,
  to: number,
  placed: readonly (readonly IAutoMovieMotionHumanArmGeometry.IPlaced[])[],
): number {
  let distance: number = 0;
  placed.forEach((arm: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[], a: number): void => {
    for (const probe of HumanArmTrajectoryTerms.SPEED) {
      const delta: IAutoMovieVector3 = HumanArmTrajectoryTravel.step(
        c.frames[a]![from]!, c.frames[a]![to]!,
        arm[0]!.probes[probe]![0], arm[1]!.probes[probe]![0],
      );
      distance = Math.max(distance, Vector3.length(delta));
    }
  });
  return distance / Math.abs(c.times[to]! - c.times[from]!);
}
