import { HumanAnatomy } from "../HumanAnatomy";

type V3 = HumanAnatomy.V3;

/**
 * Signed sagittae along a skin curve, the reading that sees a step, crack,
 * dent, ridge or wave at a glance: at each point of the curve resampled at an
 * even arc step, the distance of the point from the chord of its neighbours a
 * fixed arc either side, positive outward (the point stands out of the chord,
 * a convex bend) and negative inward (a concave bend).
 *
 * A circle of radius R has sagitta `c^2 / (8 R)` over a chord c, so a reading
 * is the curve's bending at the chord's scale: the 1 mm crease limit over a
 * 10 mm chord (`HumanAnatomyShared.CREASE`) is a radius of 12.5 mm, and a step
 * or kink reads as a pair of opposite sagittae whatever the chord.
 */
export namespace HumanSagitta {
  /** One reading. */
  export interface IReading {
    /** The point the sagitta is read at. */
    point: V3;

    /** Arc length from the curve's start to the point, the curve's own units. */
    arc: number;

    /** Signed sagitta, positive outward, the curve's units. */
    value: number;
  }

  /**
   * A polyline resampled at an even arc step by linear interpolation; the
   * first and last points are kept.
   *
   * @param line The polyline, two points or more.
   * @param step Arc step, the line's units, positive.
   * @returns The points at arc 0, step, 2 step and so on, then the end.
   */
  export function resample(line: readonly V3[], step: number): V3[] {
    const out: V3[] = [];
    if (line.length === 0) return out;
    out.push(line[0]!);
    let carry: number = 0;
    for (let i: number = 1; i < line.length; i++) {
      const a: V3 = line[i - 1]!;
      const b: V3 = line[i]!;
      const length: number = HumanAnatomy.dist(a, b);
      let t: number = step - carry;
      while (t <= length) {
        out.push(HumanAnatomy.add(a, HumanAnatomy.scale(HumanAnatomy.sub(b, a), t / length)));
        t += step;
      }
      carry = length - (t - step);
    }
    const last: V3 = line[line.length - 1]!;
    if (HumanAnatomy.dist(out[out.length - 1]!, last) > 1e-9) out.push(last);
    return out;
  }

  /**
   * Signed sagittae over chords `half` of arc either side of each point.
   *
   * @param line The curve, any sampling; resampled at `step`.
   * @param half Half the chord's arc, the line's units.
   * @param step Resampling step, the line's units; a tenth of `half` keeps the chord's ends within that share of their arc.
   * @param outward The outward direction at a point, for the sign; need not be unit.
   * @returns One reading per resampled point whose chord lies inside the curve.
   */
  export function along(line: readonly V3[], half: number, step: number, outward: (p: V3) => V3): IReading[] {
    const even: V3[] = resample(line, step);
    const reach: number = Math.round(half / step);
    const out: IReading[] = [];
    for (let i: number = reach; i + reach < even.length; i++) {
      const p: V3 = even[i]!;
      const mid: V3 = HumanAnatomy.scale(HumanAnatomy.add(even[i - reach]!, even[i + reach]!), 0.5);
      const direction: V3 = HumanAnatomy.unit(outward(p));
      out.push({ point: p, arc: i * step, value: HumanAnatomy.dot(HumanAnatomy.sub(p, mid), direction) });
    }
    return out;
  }

  /**
   * The runs of sign along a curve: consecutive readings beyond the floor of
   * one sign make one run; readings within the floor separate nothing.
   *
   * @param readings Readings in arc order.
   * @param floor Least magnitude that counts, the curve's units.
   * @returns The runs' signs in order, `+1` convex and `-1` concave.
   */
  export function runs(readings: readonly IReading[], floor: number): number[] {
    const out: number[] = [];
    for (const r of readings) {
      if (Math.abs(r.value) <= floor) continue;
      const sign: number = Math.sign(r.value);
      if (out[out.length - 1] !== sign) out.push(sign);
    }
    return out;
  }

  /**
   * The reading of largest magnitude, or null for none.
   *
   * @param readings Readings to search.
   * @param sign Restrict to one sign: `1` the most convex, `-1` the most concave, `0` either.
   */
  export function extreme(readings: readonly IReading[], sign: -1 | 0 | 1): IReading | null {
    let best: IReading | null = null;
    for (const r of readings) {
      const v: number = sign === 0 ? Math.abs(r.value) : sign * r.value;
      if (v <= 0 && sign !== 0) continue;
      if (best === null || v > (sign === 0 ? Math.abs(best.value) : sign * best.value)) best = r;
    }
    return best;
  }
}
