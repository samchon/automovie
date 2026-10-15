import { Point } from "./Point";


/** Second-axis intervals where the vertical line at `x` crosses each triangle. */
export const intervalsAt = (
  triangles: readonly (readonly [Point, Point, Point])[],
  x: number
): [number, number][] => {
  const found: [number, number][] = [];
  for (const triangle of triangles) {
    const crossings: number[] = [];
    for (let i = 0; i < 3; i++) {
      const a = triangle[i]!, b = triangle[(i + 1) % 3]!;
      if ((a[0] < x && x < b[0]) || (b[0] < x && x < a[0]))
        crossings.push(a[1] + ((x - a[0]) * (b[1] - a[1])) / (b[0] - a[0]));
    }
    if (crossings.length === 2)
      found.push([Math.min(...crossings), Math.max(...crossings)]);
  }
  found.sort((a, b) => a[0] - b[0]);
  const union: [number, number][] = [];
  for (const interval of found) {
    const last = union[union.length - 1];
    if (last !== undefined && interval[0] <= last[1] + 1e-7)
      last[1] = Math.max(last[1], interval[1]);
    else union.push([...interval]);
  }
  return union;
};
