import { ROM_TOLERANCE } from "@automovie/engine";

import type { HumanArmTrajectoryKnots as Knots } from "./HumanArmTrajectoryKnots";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * A knotted iterate's rates projected onto the ranges its positions keep: a
 * knot whose bounded coordinate lies on its bound (within the joint's
 * resolution, `ROM_TOLERANCE`) is still on it, its velocity zero (any motion
 * would leave the range on one side of the knot) and its acceleration's outward
 * part dropped, so the quintics on both sides (`HumanArmTrajectoryKnots`) meet
 * the bound tangentially instead of passing it between frames, where no row
 * reads it. The projection onto a convex set after the step, as the positions'
 * own (`HumanArmTrajectoryModel.ranged`; Bertsekas 1976, "On the
 * Goldstein-Levitin-Polyak gradient projection method", IEEE TAC 21:174).
 *
 * @param c The knots' context.
 * @param x Each arm's coordinates at each knot, in their ranges.
 * @param rates Their velocities and accelerations.
 * @returns The rates projected, fresh arrays.
 */
export function HumanArmTrajectoryRateProjection(
  c: Pick<M.IContext, "n" | "open" | "free" | "bounds">,
  x: readonly (readonly (readonly number[])[])[],
  rates: Knots.IRates,
): Knots.IRates {
  const velocities: number[][][] = rates.velocities.map(
    (arm: number[][]): number[][] => arm.map((v: number[]): number[] => [...v]),
  );
  const accelerations: number[][][] = rates.accelerations.map(
    (arm: number[][]): number[][] => arm.map((v: number[]): number[] => [...v]),
  );
  for (let k: number = 1; k < c.n; ++k) {
    if (!M.inner(c, k)) continue;
    c.free.forEach((free: readonly number[], a: number): void =>
      free.forEach((d: number): void => {
        const b: [number, number] | null | undefined = c.bounds[a]![d];
        if (b === null || b === undefined) return;
        const p: number = x[a]![k]![d]!;
        // The inward sense: up from the lower bound, down from the upper.
        const inward: number =
          p <= b[0] + ROM_TOLERANCE ? 1 : p >= b[1] - ROM_TOLERANCE ? -1 : 0;
        if (inward === 0) return;
        // Either sense of motion leaves the range on one side of the knot:
        // the knot is still there, turning back inward at most.
        velocities[a]![k]![d] = 0;
        if (inward * accelerations[a]![k]![d]! < 0)
          accelerations[a]![k]![d] = 0;
      }),
    );
  }
  return { velocities, accelerations };
}
