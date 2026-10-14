import type { Vec } from "./Vec";

/**
 * Cartesian cross product for geometric face orientation.
 *
 * The X/Y/Z determinant returns a fresh tuple in constant work and leaves both inputs unchanged. Collinear edges yield zero; normalization is a separate operation with no zero-length guard. No prior result is retained across mutable inputs.
 */
export function cross(a: Vec, b: Vec): Vec {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
