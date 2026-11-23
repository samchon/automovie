import { lerp as scalarLerp } from "../lerp";
import { clampAutoMovieUnitInterval } from "../math/clampAutoMovieUnitInterval";

/** Stateless scalar envelopes in seconds, normalized progress and radians. */
export namespace AutoMovieEnvelope {
  /** Closed-unit progress, with NaN preserved. */
  export const unit: (value: number) => number = clampAutoMovieUnitInterval;
  /** Endpoint-exact scalar interpolation; progress may extrapolate. */
  export const lerp: (from: number, to: number, progress: number) => number =
    scalarLerp;
  /** Cubic smoothstep has zero endpoint slope. */
  export function smooth(value: number): number {
    const t: number = unit(value);
    return t * t * (3 - 2 * t);
  }
  /** Quintic smootherstep has zero endpoint slope and curvature. */
  export function smoother(value: number): number {
    const t: number = unit(value);
    return t * t * t * (t * (6 * t - 15) + 10);
  }
  /** Cubic ease-out, distinct from the named quadratic motion easing. */
  export function out(value: number): number {
    const t: number = unit(value);
    return 1 - (1 - t) ** 3;
  }
  /** Smooth interval progress; a collapsed interval is a closed-end step. */
  export function ramp(seconds: number, start: number, end: number): number {
    return end <= start
      ? seconds >= end
        ? 1
        : 0
      : smooth((seconds - start) / (end - start));
  }
  /** Rise, hold and release through ordered seconds a,b,c,d. */
  export function plateau(
    seconds: number,
    a: number,
    b: number,
    c: number,
    d: number,
  ): number {
    if (seconds <= a || seconds >= d) return 0;
    if (seconds < b) return ramp(seconds, a, b);
    if (seconds <= c) return 1;
    return 1 - ramp(seconds, c, d);
  }
  /** One smooth rise and release with no hold. */
  export function pulse(
    seconds: number,
    start: number,
    peak: number,
    end: number,
  ): number {
    return plateau(seconds, start, peak, peak, end);
  }
  /** Shortest-arc interpolation in radians, preserving both pi endpoints. */
  export function angle(from: number, to: number, progress: number): number {
    let delta: number = (to - from) % (2 * Math.PI);
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
    return from + delta * progress;
  }
}
