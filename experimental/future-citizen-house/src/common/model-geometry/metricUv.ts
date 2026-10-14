import type { Vec } from "./Vec";

/**
 * Projected metre coordinates for a planar face reference.
 *
 * U/V use Z/Y when abs(normal.X) exceeds 0.5, otherwise X/Z when abs(normal.Y) exceeds 0.5, otherwise X/Y. Each coordinate is offset by the reference minimum. This projection does not measure slope length on tilted faces; callers supply finite coordinates and nonempty reference points.
 *
 * Every call rescans both reference axes and allocates mapped arrays, so time and temporary storage are linear in reference count. The returned pair is fresh; no minima are cached across mutable reference points.
 */
export function metricUv(p: Vec, n: Vec, points: Vec[]): [number, number] {
  const axis: number[] =
    Math.abs(n[0]) > 0.5 ? [2, 1] : Math.abs(n[1]) > 0.5 ? [0, 2] : [0, 1];
  return [
    p[axis[0]] - Math.min(...points.map((q: Vec) : number => q[axis[0]])),
    p[axis[1]] - Math.min(...points.map((q: Vec) : number => q[axis[1]])),
  ];
}
