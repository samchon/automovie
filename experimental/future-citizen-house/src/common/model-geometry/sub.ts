import type { Vec } from "./Vec";

/**
 * Componentwise difference of two Cartesian triples.
 *
 * Three ordinary floating-point subtractions return a fresh tuple in constant work without changing either input. Small displacements and nonfinite components are not clamped or sanitized. The caller owns the result and no prior difference is cached.
 */
export function sub(a: Vec, b: Vec): Vec {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
