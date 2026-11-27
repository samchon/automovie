import type { crutchHeldLeg } from "./crutchHeldLeg";

/*
 * A swept point's least signed distance from a flight's solid, in its climb's
 * vertical plane: over each level, the region below its height from where it
 * begins to where the next begins, the least over the chord from one place to
 * the other of the region's signed distance, which is convex along the chord
 * (the signed distance of a convex set is convex), so the golden-section search
 * finds it (Kiefer 1953, "Sequential minimax search for a maximum", Proc. AMS
 * 4(3):502); the least over the levels. A chord of no length is the point's own
 * distance.
 * Parameter steps: The levels.
 * Parameter a: The chord's first place, (ahead of the origin, height), metres.
 * Parameter b: Its last place.
 * Returns: The distance, metres; negative inside.
 */
export function crutchHeldLegSweptDepth(
  steps: readonly crutchHeldLeg.IStep[],
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  let best: number = Infinity;
  steps.forEach((step: crutchHeldLeg.IStep, k: number): void => {
    const low: number = step.from;
    const high: number = steps[k + 1]?.from ?? Infinity;
    const sdf: (u: number) => number = (u: number): number => {
      const ahead: number = a[0] + u * (b[0] - a[0]);
      const height: number = a[1] + u * (b[1] - a[1]);
      const dz: number = Math.max(low - ahead, 0, ahead - high);
      const dy: number = Math.max(height - step.height, 0);
      return dz > 0 || dy > 0
        ? Math.hypot(dz, dy)
        : -Math.min(ahead - low, high - ahead, step.height - height);
    };
    let lo: number = 0;
    let hi: number = 1;
    if (a[0] !== b[0] || a[1] !== b[1])
      for (let i: number = 0; i < ITERATIONS; ++i) {
        const m1: number = hi - GOLDEN * (hi - lo);
        const m2: number = lo + GOLDEN * (hi - lo);
        if (sdf(m1) <= sdf(m2)) hi = m2;
        else lo = m1;
      }
    best = Math.min(best, sdf(0), sdf(1), sdf((lo + hi) / 2));
  });
  return best;
}

/*
 * The golden ratio's reciprocal, the section's share.
 */
const GOLDEN: number = (Math.sqrt(5) - 1) / 2;

/*
 * The search's steps: each keeps 0.618 of the interval, so 80 bring the unit
 * chord's interval under double precision's resolution of it.
 */
const ITERATIONS: number = 80;
