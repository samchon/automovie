import type { crutchHeldLeg } from "./crutchHeldLeg";

/**
 * A point's signed distance from a flight's solid, in its climb's vertical
 * plane: the least over its levels, each the region below its height from where
 * it begins to where the next begins.
 *
 * @param steps The levels.
 * @param ahead The point's distance ahead of the origin, metres.
 * @param height Its height, world metres.
 * @returns The distance, metres; negative inside.
 */
export function crutchHeldLegDepth(
  steps: readonly crutchHeldLeg.IStep[],
  ahead: number,
  height: number,
): number {
  let best: number = Infinity;
  steps.forEach((step: crutchHeldLeg.IStep, k: number): void => {
    const low: number = step.from;
    const high: number = steps[k + 1]?.from ?? Infinity;
    const dz: number = Math.max(low - ahead, 0, ahead - high);
    const dy: number = Math.max(height - step.height, 0);
    best = Math.min(
      best,
      dz > 0 || dy > 0
        ? Math.hypot(dz, dy)
        : -Math.min(ahead - low, high - ahead, step.height - height),
    );
  });
  return best;
}
