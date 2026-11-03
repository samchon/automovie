import { AutoMovieHumanSeam } from "../../lofting/AutoMovieHumanSeam";
import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus: add, scale, dot, unit }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/**
 * The two curve readings a web's surface needs: a station curve's jet at a
 * chain's end ring by arclength (the jet a column copies from its parent and
 * child), and a curve read by its depth along a direction (a web's rows are
 * level sets of that depth).
 */
export namespace AutoMovieHumanWebCurve {
  /** Station step of a surface derivative, mm. */
  export const H: number = 0.05;

  /** Samples of a column read for its levels. */
  const LEVEL_SAMPLES: number = 256;

  /** Bisections of a level's bracket on the curve's own parameter. */
  const BISECTIONS: number = 40;

  /**
   * A station curve's jet at a chain's end ring from three samples a step `H`
   * apart going in: the one-sided three-point first and second derivatives,
   * published by arclength. `sense` -1 reads the curve leaving the ring
   * outward (a parent), 1 entering it (a child).
   */
  export function leaving(on: Vec3, inner: Vec3, deep: Vec3, sense: number): IAutoMovieHumanSeam.IArcJet {
    const d1: Vec3 = [0, 1, 2].map((k: number): number => (sense * (-3 * on[k]! + 4 * inner[k]! - deep[k]!)) / (2 * H)) as Vec3;
    const d2: Vec3 = [0, 1, 2].map((k: number): number => (on[k]! - 2 * inner[k]! + deep[k]!) / (H * H)) as Vec3;
    return AutoMovieHumanSeam.publish(on, d1, d2);
  }

  /**
   * A curve read by its depth along a direction from its start: the point where
   * it first reaches a depth, so a web's rows are level sets of that depth. A
   * curve that leaves its start across the direction (a saddle's own column)
   * reaches its first depths at their square root. Past its ends it runs on
   * along its end tangents.
   */
  export function sampled(curve: (u: number) => Vec3, direction: Vec3): (depth: number) => Vec3 {
    const samples: Vec3[] = Array.from({ length: LEVEL_SAMPLES + 1 }, (_: unknown, i: number): Vec3 => curve(i / LEVEL_SAMPLES));
    const start: Vec3 = samples[0]!;
    const depth: number[] = samples.map((p: Vec3): number => dot(sub(p, start), direction));
    // Depth never falls back along a column: hold its running maximum.
    for (let i: number = 1; i <= LEVEL_SAMPLES; i++) depth[i] = Math.max(depth[i]!, depth[i - 1]!);
    const end: number = depth[LEVEL_SAMPLES]!;
    const along = (i: number, j: number): Vec3 => unit(sub(samples[j]!, samples[i]!));
    return (goal: number): Vec3 => {
      if (goal <= 0) return start;
      if (goal >= end) {
        const t: Vec3 = along(LEVEL_SAMPLES - 1, LEVEL_SAMPLES);
        return add(samples[LEVEL_SAMPLES]!, scale(t, (goal - end) / Math.max(0.2, dot(t, direction))));
      }
      let lo: number = 0;
      let hi: number = LEVEL_SAMPLES;
      while (hi - lo > 1) {
        const mid: number = (lo + hi) >> 1;
        if (depth[mid]! < goal) lo = mid;
        else hi = mid;
      }
      // The curve's own point at that depth between the two samples that
      // bracket it, by bisection of its parameter, so the reading is as
      // smooth as the curve.
      let a: number = lo / LEVEL_SAMPLES;
      let b: number = hi / LEVEL_SAMPLES;
      for (let i: number = 0; i < BISECTIONS; i++) {
        const m: number = (a + b) / 2;
        if (dot(sub(curve(m), start), direction) < goal) a = m;
        else b = m;
      }

      return curve((a + b) / 2);
    };
  }
}
