import type { IAutoMovieAngleRange } from "@automovie/interface";

import type { HumanMinimumJerkSpline } from "../posture/HumanMinimumJerkSpline";

interface IProps {
  times: readonly number[];
  positions: readonly (readonly number[])[];
  jets: HumanMinimumJerkSpline.IDerivatives;
  limits: readonly (IAutoMovieAngleRange | null | undefined)[];
}

/**
 * Keep each interior knot's shared velocity and acceleration inside the joint
 * range on both adjacent quintics. Shrink the pair only until its Bernstein
 * control ordinates all lie inside that range. Both segments keep the same
 * derivatives at the knot. The caller owns the prescribed endpoints.
 *
 * @see https://doi.org/10.1090/S0025-5718-1989-0962209-1
 */
export function boundMountKnotJets({
  times,
  positions,
  jets,
  limits,
}: IProps): HumanMinimumJerkSpline.IDerivatives {
  const velocities: number[][] = jets.velocities.map((row) => row.slice());
  const accelerations: number[][] = jets.accelerations.map((row) =>
    row.slice(),
  );
  for (let i: number = 1; i < times.length - 1; ++i) {
    const before: number = times[i]! - times[i - 1]!;
    const after: number = times[i + 1]! - times[i]!;
    for (const [axis, range] of limits.entries()) {
      if (range === undefined) continue;
      const p: number = positions[i]![axis]!;
      const v: number = jets.velocities[i]![axis]!;
      const a: number = jets.accelerations[i]![axis]!;
      if (v === 0 && a === 0) continue;
      const min: number = range?.min ?? 0;
      const max: number = range?.max ?? 0;
      const left: number = (before * v) / 5;
      const right: number = (after * v) / 5;
      const scale: number = Math.max(
        0,
        Math.min(
          1,
          room(p, -left, min, max),
          room(p, -2 * left + (before * before * a) / 20, min, max),
          room(p, right, min, max),
          room(p, 2 * right + (after * after * a) / 20, min, max),
        ),
      );
      velocities[i]![axis] = scale * v;
      accelerations[i]![axis] = scale * a;
    }
  }
  return { velocities, accelerations };
}

/** How much of a control ordinate's displacement stays within the interval. */
function room(p: number, delta: number, min: number, max: number): number {
  if (delta > 0) return (max - p) / delta;
  if (delta < 0) return (min - p) / delta;
  return 1;
}
