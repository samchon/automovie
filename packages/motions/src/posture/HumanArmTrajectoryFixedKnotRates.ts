import { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryRateProjection } from "./HumanArmTrajectoryRateProjection";

/**
 * Recompute the interior rates of a held body's arm curve on the existing
 * native frames. The original sampled poses, phase times and outside 2-jets
 * are fixed. The caller still admits the resulting played curve independently.
 *
 * @param c The native frame context and the authored fixed body interval.
 * @param native The original trajectory's poses at the native frames.
 * @param clock The original playback knots.
 * @param x The original playback coordinates.
 * @param rates The original playback velocities and accelerations.
 * @returns The candidate curve, or none if projection modifies the joins.
 */
export function HumanArmTrajectoryFixedKnotRates(
  c: M.IContext,
  native: number[][][],
  clock: readonly number[],
  x: number[][][],
  rates: Knots.IRates,
): HumanArmTrajectoryFixedKnotRates.ICurve | undefined {
  const fixed = c.fixedSelf;
  if (fixed === undefined) return undefined;
  const [from, to] = fixed;
  if (!c.times.includes(from) || !c.times.includes(to)) return undefined;
  const interior = c.times.filter((t) => t > from && t < to);
  if (interior.length === 0) return undefined;
  const times: number[] = [...new Set([...clock, from, ...interior, to])].sort(
    (a, b) => a - b,
  );
  const dense = Knots.bounded(c, native);
  const chosen = x.map((rows, a) =>
    times.map((t) => {
      const k = c.times.indexOf(t);
      return t > from && t < to && k >= 0
        ? [native[a]![k]!, dense.velocities[a]![k]!, dense.accelerations[a]![k]!]
        : Knots.at(clock, rows, rates.velocities[a]!, rates.accelerations[a]!, t);
    }),
  );
  const coordinates: number[][][] = chosen.map((arm) => arm.map((r) => r[0]!));
  const trial: Knots.IRates = {
    velocities: chosen.map((arm) => arm.map((r) => r[1]!)),
    accelerations: chosen.map((arm) => arm.map((r) => r[2]!)),
  };
  const projected = HumanArmTrajectoryRateProjection(
    {
      times, n: times.length, open: c.open,
      free: c.free, bounds: c.bounds, rest: c.rest, back: c.back,
    },
    coordinates,
    trial,
  );
  const preserved = (read: number[][][], original: number[][][]): boolean =>
    read.every((arm, a) => arm.every((row, k) =>
      (times[k]! > from && times[k]! < to) ||
      row.every((value, d) => value === original[a]![k]![d]),
    ));
  if (!preserved(projected.velocities, trial.velocities) ||
      !preserved(projected.accelerations, trial.accelerations)) return undefined;
  return { times, x: coordinates, rates: projected };
}

/** Operation-local boundary types for the stationary body rate candidate. */
export namespace HumanArmTrajectoryFixedKnotRates {
  /** A candidate steady-body course with unchanged poses and exact joins. */
  export interface ICurve {
    /** The original and stationary native knot instants in seconds. */
    times: number[];
    /** The original interpolant's coordinates at those instants. */
    x: number[][][];
    /** The candidate's bounded rates. */
    rates: Knots.IRates;
  }
}
