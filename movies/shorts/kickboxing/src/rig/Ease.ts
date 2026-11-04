/**
 * Deterministic scalar envelopes used to shape every authored motion curve.
 *
 * @evidence contracts/common.md#implementation-and-ownership Pure closed-form polynomials and piecewise windows; no state, randomness or wall clock, so any film second evaluates identically on seek, replay and export.
 * @evidence contracts/common.md#authoring-interface Inputs are seconds or unit progress as named. Every envelope returns a value in [0, 1] and is C¹-continuous at its joins unless stated.
 */
export namespace Ease {
  /**
   * Clamp to [0, 1].
   *
   * @evidence contracts/common.md#implementation-and-ownership Clamp.
   * @evidence contracts/common.md#authoring-interface Any number in, [0, 1] out.
   */
  export function unit(value: number): number {
    return value <= 0 ? 0 : value >= 1 ? 1 : value;
  }

  /**
   * Cubic smoothstep of unit progress: zero slope at both ends.
   *
   * @evidence contracts/common.md#implementation-and-ownership Cubic 3t² − 2t³.
   * @evidence contracts/common.md#authoring-interface Unit progress in and out.
   */
  export function smooth(value: number): number {
    const t: number = unit(value);
    return t * t * (3 - 2 * t);
  }

  /**
   * Quintic smootherstep: zero slope and curvature at both ends.
   *
   * @evidence contracts/common.md#implementation-and-ownership Quintic 6t⁵ − 15t⁴ + 10t³.
   * @evidence contracts/common.md#authoring-interface Unit progress in and out.
   */
  export function smoother(value: number): number {
    const t: number = unit(value);
    return t * t * t * (t * (6 * t - 15) + 10);
  }

  /**
   * Fast start, soft landing, for punches and kicks driving into a target.
   *
   * @evidence contracts/common.md#implementation-and-ownership Cubic 1 − (1 − t)³.
   * @evidence contracts/common.md#authoring-interface Unit progress in and out.
   */
  export function out(value: number): number {
    const t: number = unit(value);
    return 1 - (1 - t) * (1 - t) * (1 - t);
  }

  /**
   * Progress of `t` across [start, end], eased smoothly.
   *
   * @evidence contracts/common.md#implementation-and-ownership Smoothstep over an interval; a degenerate interval is a step.
   * @evidence contracts/common.md#authoring-interface Seconds in; unit out.
   */
  export function ramp(t: number, start: number, end: number): number {
    return end <= start
      ? t >= end
        ? 1
        : 0
      : smooth((t - start) / (end - start));
  }

  /**
   * Rise over [a, b], hold to c, fall over [c, d]: a plateau envelope.
   *
   * Equal neighbours collapse to an instantaneous edge.
   *
   * @evidence contracts/common.md#implementation-and-ownership Two smoothsteps joined by a hold.
   * @evidence contracts/common.md#authoring-interface Seconds a ≤ b ≤ c ≤ d; unit out.
   */
  export function plateau(
    t: number,
    a: number,
    b: number,
    c: number,
    d: number,
  ): number {
    if (t <= a || t >= d) return 0;
    if (t < b) return ramp(t, a, b);
    if (t <= c) return 1;
    return 1 - ramp(t, c, d);
  }

  /**
   * Single smooth pulse rising over [a, peak] and falling over [peak, b].
   *
   * @evidence contracts/common.md#implementation-and-ownership Plateau with a single peak.
   * @evidence contracts/common.md#authoring-interface Seconds; unit out.
   */
  export function pulse(t: number, a: number, peak: number, b: number): number {
    return plateau(t, a, peak, peak, b);
  }

  /**
   * Linear interpolation.
   *
   * @evidence contracts/common.md#implementation-and-ownership Unclamped linear interpolation.
   * @evidence contracts/common.md#authoring-interface Any numbers.
   */
  export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Shortest-arc angle interpolation in radians.
   *
   * @evidence contracts/common.md#implementation-and-ownership Wraps the difference into (−π, π] before interpolating.
   * @evidence contracts/common.md#authoring-interface Radians.
   */
  export function angle(a: number, b: number, t: number): number {
    let delta: number = (b - a) % (2 * Math.PI);
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    return a + delta * t;
  }
}
