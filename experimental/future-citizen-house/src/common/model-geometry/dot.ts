import type { Vec } from "./Vec";

/**
 * Scalar dot product of two Cartesian triples.
 *
 * Triangle winding and leaf UV projection use the three component products and two ordinary floating-point additions. There is no compensated reduction or epsilon sign correction. Inputs are read without mutation, collections or retained state.
 */
export function dot(a: Vec, b: Vec): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
