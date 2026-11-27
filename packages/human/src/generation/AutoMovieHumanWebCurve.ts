import type {
  AutoMovieVector3Tuple,
  IAutoMovieArcLengthJet,
  IAutoMovieHumanWebCurve,
} from "@automovie/interface";

import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

const {
  sub,
  plus: add,
  scale,
  dot,
  unit,
}: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/**
 * The two curve readings a web's surface needs: a station curve's jet at a
 * chain's end ring by arclength (the jet a column copies from its parent and
 * child), and a curve read by its depth along a direction (a web's rows are
 * level sets of that depth).
 */
export namespace AutoMovieHumanWebCurve {
  /** Station step of a surface derivative, mm. */
  export const H: number = 0.05;

  /*
   * Samples of a column read for its levels.
   */
  const LEVEL_SAMPLES: number = 256;

  /*
   * Most Illinois steps of a level's bracket on the curve's own parameter.
   */
  const STEPS: number = 40;

  /*
   * Depth within which a point lies on its level, mm.
   */
  const LEVEL: number = 1e-9;

  /**
   * A station curve's jet at a chain's end ring from three samples a step `H`
   * apart going in: the one-sided three-point first and second derivatives,
   * published by arclength. `sense` -1 reads the curve leaving the ring
   * outward (a parent), 1 entering it (a child).
   */
  export function leaving(
    on: AutoMovieVector3Tuple,
    inner: AutoMovieVector3Tuple,
    deep: AutoMovieVector3Tuple,
    sense: number,
  ): IAutoMovieArcLengthJet {
    const d1: AutoMovieVector3Tuple = [0, 1, 2].map(
      (k: number): number =>
        (sense * (-3 * on[k]! + 4 * inner[k]! - deep[k]!)) / (2 * H),
    ) as AutoMovieVector3Tuple;
    const d2: AutoMovieVector3Tuple = [0, 1, 2].map(
      (k: number): number => (on[k]! - 2 * inner[k]! + deep[k]!) / (H * H),
    ) as AutoMovieVector3Tuple;
    return AutoMovieHumanSeam.publish(on, d1, d2);
  }

  /**
   * A curve read by its depth along a direction from its start: the point where
   * it first reaches a depth, so a web's rows are level sets of that depth. A
   * curve that leaves its start across the direction (a saddle's own column)
   * reaches its first depths at their square root. Past its ends it runs on
   * along its end tangents.
   */
  export function sampled(
    curve: IAutoMovieHumanWebCurve.SampledCurve,
    direction: AutoMovieVector3Tuple,
  ): IAutoMovieHumanWebCurve.SampledResult {
    const samples: AutoMovieVector3Tuple[] = Array.from(
      { length: LEVEL_SAMPLES + 1 },
      (_: unknown, i: number): AutoMovieVector3Tuple =>
        curve(i / LEVEL_SAMPLES),
    );
    const start: AutoMovieVector3Tuple = samples[0]!;
    const depth: number[] = samples.map((p: AutoMovieVector3Tuple): number =>
      dot(sub(p, start), direction),
    );
    // Depth never falls back along a column: hold its running maximum.
    for (let i: number = 1; i <= LEVEL_SAMPLES; i++)
      depth[i] = Math.max(depth[i]!, depth[i - 1]!);
    const end: number = depth[LEVEL_SAMPLES]!;
    const along = (i: number, j: number): AutoMovieVector3Tuple =>
      unit(sub(samples[j]!, samples[i]!));
    return (goal: number): AutoMovieVector3Tuple => {
      if (goal <= 0) return start;
      if (goal >= end) {
        const t: AutoMovieVector3Tuple = along(
          LEVEL_SAMPLES - 1,
          LEVEL_SAMPLES,
        );
        return add(
          samples[LEVEL_SAMPLES]!,
          scale(t, (goal - end) / Math.max(0.2, dot(t, direction))),
        );
      }
      let lo: number = 0;
      let hi: number = LEVEL_SAMPLES;
      while (hi - lo > 1) {
        const mid: number = (lo + hi) >> 1;
        if (depth[mid]! < goal) lo = mid;
        else hi = mid;
      }
      // The curve's own point at that depth between the two samples that
      // bracket it, by the Illinois rule on its parameter (regula falsi that
      // halves the stale end's value), so the reading is as smooth as the
      // curve and takes a few evaluations instead of forty.
      let a: number = lo / LEVEL_SAMPLES;
      let b: number = hi / LEVEL_SAMPLES;
      let fa: number = dot(sub(samples[lo]!, start), direction) - goal;
      let fb: number = dot(sub(samples[hi]!, start), direction) - goal;
      if (!(fa < 0) || !(fb >= 0)) {
        // The running maximum bracketed a dip: bisect as before.
        for (let i: number = 0; i < STEPS; i++) {
          const m: number = (a + b) / 2;
          if (dot(sub(curve(m), start), direction) < goal) a = m;
          else b = m;
        }
        return curve((a + b) / 2);
      }
      let side: number = 0;
      let point: AutoMovieVector3Tuple = samples[hi]!;
      for (let i: number = 0; i < STEPS; i++) {
        const m: number = (a * fb - b * fa) / (fb - fa);
        point = curve(m);
        const fm: number = dot(sub(point, start), direction) - goal;
        if (Math.abs(fm) <= LEVEL || b - a <= 1e-15) return point;
        if (fm < 0) {
          a = m;
          fa = fm;
          if (side === -1) fb /= 2;
          side = -1;
        } else {
          b = m;
          fb = fm;
          if (side === 1) fa /= 2;
          side = 1;
        }
      }
      return point;
    };
  }
}
