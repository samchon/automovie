import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * How far one arm's coordinates at a frame pass their hard ranges: each bounded
 * free coordinate's excess over its box and the shoulder chart's swing past its
 * disc, the largest, weighted by `HumanArmTrajectoryTerms.RANGE` into the
 * solver's tolerance units; negative or zero inside them. The same ranges the
 * convex model's elastic rows hold at every frame (`HumanArmTrajectoryRanges`)
 * and the projection holds at the knots (`HumanArmTrajectoryModel.ranged`),
 * read here on the course between knots, where the interpolant can pass a bound
 * the knots keep.
 *
 * @param c The context.
 * @param a The arm.
 * @param v Its coordinates at the frame.
 * @param swing The chart's disc radius (`HumanArmTrajectoryModel.swing`).
 * @returns The largest excess, in tolerance units.
 */
export function HumanArmTrajectoryRangeExcess(
  c: Pick<M.IContext, "free" | "bounds">,
  a: number,
  v: readonly number[],
  swing: number,
): number {
  let excess: number = Math.hypot(v[0]!, v[1]!) - swing;
  for (const d of c.free[a]!) {
    const b: [number, number] | null | undefined = c.bounds[a]![d];
    if (b !== null && b !== undefined)
      excess = Math.max(excess, b[0] - v[d]!, v[d]! - b[1]);
  }
  return T.RANGE * excess;
}
