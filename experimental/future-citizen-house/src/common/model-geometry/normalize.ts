import type { Vec } from "./Vec";

/**
 * Divide a Cartesian triple by its Euclidean length.
 *
 * Callers supply a finite nonzero vector. Math.hypot and three divisions produce a fresh mutable tuple without changing the input; zero or nonfinite lengths can produce NaN or zero components and receive no fallback axis. Work and allocation are constant, and no result is cached across mutable inputs.
 */
export function normalize(a: Vec): Vec {
  const length: number = Math.hypot(...a);
  return [a[0] / length, a[1] / length, a[2] / length];
}
