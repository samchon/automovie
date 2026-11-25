import type { HumanArmSeed } from "./HumanArmSeed";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * The iterate after a step of the convex subproblem: each inner waypoint's
 * free coordinates moved by the step, the others kept, then projected onto
 * the hard ranges (`ranged`), which the subproblem meets only to its
 * linearisation and its solver's tolerance.
 *
 * @param c The context.
 * @param x Each arm's coordinates at each waypoint.
 * @param step The subproblem's solution, by waypoint and then arm.
 * @param pinned Exact positions of the solved hold poses.
 * @returns The new iterate.
 */
export function HumanArmTrajectoryStep(
  c: M.IContext,
  x: readonly (readonly number[])[][],
  step: Float64Array,
  pinned?: HumanArmSeed.IHolds,
): number[][][] {
  return x.map((arm: readonly (readonly number[])[], a: number): number[][] =>
    arm.map((v: readonly number[], k: number): number[] => {
      const held: number[] | undefined = pinned?.get(c.times[k]!)?.[a];
      if (held !== undefined) return [...held];
      const out: number[] = [...v];
      if (!M.inner(c, k)) return out;
      c.free[a]!.forEach((d: number, f: number): void => {
        out[d] = out[d]! + step[(k - 1) * c.width + c.offset[a]! + f]!;
      });
      return M.ranged(c, a, out);
    }),
  );
}
