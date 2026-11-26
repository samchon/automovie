import { Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmClearance,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmContactConfigurations } from "./HumanArmContactConfigurations";
import { HumanArmDifferential } from "./HumanArmDifferential";
import { HumanArmGeometry } from "./HumanArmGeometry";
import { HumanArmOptimiser } from "./HumanArmOptimiser";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import { HumanArmTrajectoryContactCircle } from "./HumanArmTrajectoryContactCircle";
import { HumanArmTrajectoryContext } from "./HumanArmTrajectoryContext";
import { HumanArmTrajectoryLaid } from "./HumanArmTrajectoryLaid";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel } from "./HumanArmTrajectoryTravel";

/**
 * Trace each feasible endpoint swivel component towards an admitted hold in
 * both time directions. Uses the original course's physical limits, including
 * its time-dependent pace, for the final whole-course admission.
 *
 * @param held The waypoint indices of the original hold.
 * @param course The original course and its prepared canonical problem.
 * @param tempo The explicit replan's duration multiplier.
 * @returns The new admitted course when continuation finds one.
 */
export function HumanArmTrajectoryContactContinuation(
  held: readonly number[],
  course: HumanArmTrajectoryLaid.IAdmitted,
  tempo?: number,
): HumanArmTrajectoryLaid.IAdmitted {
  const previous: M.IEvaluation | undefined = course.read.evaluation;
  if (course.admitted || previous === undefined) return course;
  // Interior-only failures already have two fixed boundaries for the
  // trajectory owner's local splice. Reconstruct an endpoint branch only
  // when one of the held endpoints actually belongs to a failed interval.
  if (!previous.failing[held[0]!] && !previous.failing[held[held.length - 1]!])
    return course;
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
  const x: number[][][] = course.read.x.map((arm: number[][]): number[][] => [
    ...arm,
  ]);
  const canonical: HumanArmTrajectory.IProblem = course.read.problem;

  // Retain the original geometry and allowances at each physical instant.
  const subcontext = (frames: readonly number[], still: boolean): M.IContext =>
    HumanArmTrajectoryContext.window(c, frames, still) ??
    course.read.of(
      {
        ...canonical,
        still,
        times: frames.map((i: number): number => c.times[i]!),
        bases: frames.map((i: number) => canonical.bases[i]!),
        arms: canonical.arms.map(
          (arm: HumanArmTrajectory.IArm): HumanArmTrajectory.IArm => ({
            ...arm,
            sites: frames.map((i: number) => arm.sites[i]),
          }),
        ),
      },
      c,
    );
  const follow = (
    boundary: number,
    terminal: number,
    other: number,
  ): number | undefined => {
    if (boundary === terminal) return boundary;
    const direction: number = Math.sign(boundary - terminal);
    const point: M.IContext = subcontext(
      [Math.max(0, terminal - 1), terminal, Math.min(c.n - 1, terminal + 1)],
      true,
    );
    const members: number[][][] = [];
    for (let a: number = 0; a < x.length; ++a) {
      const choices: number[][] = [];
      for (const reference of [
        x[a]![boundary]!,
        x[a]![terminal]!,
        c.rest[a]!,
      ]) {
        for (const q of HumanArmTrajectoryContactCircle(
          c,
          a,
          terminal,
          reference,
        ))
          if (
            !choices.some((known: number[]): boolean =>
              known.every((v: number, d: number): boolean => v === q[d]),
            )
          )
            choices.push(q);
      }
      if (choices.length === 0) return undefined;
      members.push(choices);
    }
    const frames: number[] = Array.from(
      { length: Math.abs(boundary - terminal) + 1 },
      (_: unknown, i: number): number => terminal + i * direction,
    );
    const curveContext: M.IContext = subcontext(frames, false);
    curveContext.times = frames.map(
      (k: number): number => direction * (c.times[k]! - c.times[terminal]!),
    );
    curveContext.speed = (seconds: number): number =>
      c.speed(c.times[terminal]! + direction * seconds);
    const intervals: M.IContext[] = Array.from(
      { length: (other - terminal) * direction },
      (_: unknown, i: number): M.IContext => {
        const from: number = terminal + i * direction;
        const k: number = from + direction;
        const local: M.IContext = subcontext([from, k], false);
        local.times = [0, Math.abs(c.times[k]! - c.times[from]!)];
        local.speed = (): number => c.speed((c.times[k]! + c.times[from]!) / 2);
        return local;
      },
    );
    // Each disconnected component gets an independent continuation.
    for (const end of HumanArmContactConfigurations(members)) {
      const at: number[][][] = end.map((q: number[], a: number): number[][] => [
        point.rest[a]!,
        q,
        point.back[a]!,
      ]);
      if (M.evaluate(point, at).worst.value > M.TOLERANCE) continue;
      // Try a Hermite span with the original adjoining physical rates.
      // Exact frame sites and swept intervals decide how much can be taken
      // directly; only the remainder needs scored swivels or a local solve.
      const curve: number[][][] = endpointCurve(c, x, end, frames);
      const inspected: M.IEvaluation = M.evaluate(curveContext, curve);
      const firstFailure: number = frames.findIndex(
        (_: number, i: number): boolean =>
          inspected.failing[i]! ||
          curve.some((arm: number[][], a: number): boolean => {
            const q: number[] = arm[i]!;
            return M.ranged(c, a, q).some(
              (angle: number, d: number): boolean => angle !== q[d],
            );
          }),
      );
      const prefix: number =
        firstFailure < 0 ? frames.length : Math.max(1, firstFailure);
      for (const count of prefix === 1 ? [1] : [prefix, 1]) {
        const path: number[][][] = curve.map((arm: number[][]): number[][] =>
          arm.slice(0, count),
        );
        if (count === frames.length) {
          path.forEach((arm: number[][], a: number): void => {
            for (let i: number = 0; i + 1 < count; ++i)
              x[a]![frames[i]!] = arm[i]!;
          });
          return boundary;
        }
        let join: number | undefined;
        let best: number = Infinity;
        let approach: number = 0;
        for (
          let k: number = terminal + count * direction;
          direction * (k - other) <= 0;
          k += direction
        ) {
          const from: number = k - direction;
          const local: M.IContext = intervals[(from - terminal) * direction]!;
          const last: number[][] = path.map(
            (arm: number[][]): number[] => arm[arm.length - 1]!,
          );
          const joined: number[][][] = last.map(
            (q: number[], a: number): number[][] => [q, x[a]![k]!],
          );
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
              const departure: number =
                next >= 0 && next < c.n
                  ? fastest(
                      c,
                      k,
                      next,
                      previous.placed.map(
                        (
                          arm: IAutoMovieMotionHumanArmGeometry.IPlaced[],
                        ): IAutoMovieMotionHumanArmGeometry.IPlaced[] => [
                          arm[k]!,
                          arm[next]!,
                        ],
                      ),
                    )
                  : 0;
              if (speed <= Math.max(approach, departure)) break;
            }
          }
          const seed: number[][][] = last.map(
            (q: number[], a: number): number[][] => {
              const circle: number[] | undefined =
                HumanArmTrajectoryContactCircle(c, a, k, q, from)[0];
              if (circle !== undefined) return [q, circle];
              const site: M.ISite | undefined = c.sites[a]![k];
              if (site === undefined || site.on !== undefined)
                return [q, x[a]![k]!];
              const placed: ReturnType<typeof HumanArmGeometry.placed> =
                HumanArmGeometry.placed(
                  c.setups[a]!,
                  c.frames[a]![k]!,
                  q,
                  false,
                );
              const error: IAutoMovieVector3 = Vector3.subtract(
                site.point,
                HumanArmTrajectoryPairs.pad(placed, site.contact),
              );
              const step: number[] = HumanArmDifferential.step(
                c.setups[a]!,
                c.frames[a]![k]!,
                q,
                site.contact,
                error,
              );
              return [
                q,
                M.ranged(
                  c,
                  a,
                  q.map((v: number, d: number): number => v + step[d]!),
                ),
              ];
            },
          );
          let tracked: number[][][] = seed;
          let measured: M.IEvaluation = M.evaluate(local, seed);
          if (measured.worst.value > M.TOLERANCE) {
            const fit: ReturnType<typeof HumanArmOptimiser.optimise> =
              HumanArmOptimiser.optimise(local, seed);
            if (fit.evaluation.worst.value > M.TOLERANCE) break;
            tracked = fit.x;
            measured = fit.evaluation;
          }
          approach = fastest(c, from, k, measured.placed);
          tracked.forEach((arm: number[][], a: number): void => {
            path[a]!.push(arm[1]!);
          });
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
    }
    return undefined;
  };
  const last: number = first + length - 1;
  const joined: number | undefined = follow(first, held[0]!, last);
  if (
    joined === undefined ||
    follow(last, held[held.length - 1]!, joined) === undefined
  )
    return course;
  const candidate: HumanArmTrajectoryLaid.IAdmitted =
    HumanArmTrajectoryLaid.readmit(
      course,
      x.map((arm: number[][], a: number) =>
        arm.map(
          (
            q: number[],
            k: number,
          ): IAutoMovieMotionHumanArmClearance.IArm | undefined =>
            k >= held[0]! && k <= held[held.length - 1]!
              ? HumanArmGeometry.arm(c.setups[a]!, q)
              : undefined,
        ),
      ),
      tempo,
    );
  return candidate.admitted ? candidate : course;
}

/**
 * Sample one Hermite segment, matching the source's adjacent coordinate rates
 * in seconds.
 */
function endpointCurve(
  c: M.IContext,
  x: readonly number[][][],
  endpoint: readonly number[][],
  frames: readonly number[],
): number[][][] {
  const left: number = frames[0]!;
  const right: number = frames[frames.length - 1]!;
  const direction: number = Math.sign(right - left);
  const prior: number = Math.max(0, Math.min(c.n - 1, left - direction));
  const before: number = Math.max(0, right - 1);
  const after: number = Math.min(c.n - 1, right + 1);
  const span: number = c.times[right]! - c.times[left]!;
  return x.map((arm: number[][], a: number): number[][] => {
    const q: number[] = endpoint[a]!;
    const r: number[] = arm[right]!;
    const startRate: number[] = q.map((_: number, d: number): number =>
      left === prior
        ? 0
        : (arm[left]![d]! - arm[prior]![d]!) /
          (c.times[left]! - c.times[prior]!),
    );
    const endRate: number[] = r.map(
      (_: number, d: number): number =>
        (arm[after]![d]! - arm[before]![d]!) /
        (c.times[after]! - c.times[before]!),
    );
    return frames.map((k: number): number[] => {
      if (k === left) return q;
      if (k === right) return r;
      const share: number = (c.times[k]! - c.times[left]!) / span;
      return q.map((angle: number, d: number): number =>
        AutoMovieEngineMath.cubicHermiteValue(
          angle,
          startRate[d]!,
          r[d]!,
          endRate[d]!,
          span,
          share,
        ),
      );
    });
  });
}

/** Peak native probe speed across one tested transition in either direction. */
function fastest(
  c: M.IContext,
  from: number,
  to: number,
  placed: readonly (readonly IAutoMovieMotionHumanArmGeometry.IPlaced[])[],
): number {
  let distance: number = 0;
  placed.forEach(
    (
      arm: readonly IAutoMovieMotionHumanArmGeometry.IPlaced[],
      a: number,
    ): void => {
      for (const probe of HumanArmTrajectoryTerms.SPEED) {
        const delta: IAutoMovieVector3 = HumanArmTrajectoryTravel.step(
          c.frames[a]![from]!,
          c.frames[a]![to]!,
          arm[0]!.probes[probe]![0],
          arm[1]!.probes[probe]![0],
        );
        distance = Math.max(distance, Vector3.length(delta));
      }
    },
  );
  return distance / Math.abs(c.times[to]! - c.times[from]!);
}
