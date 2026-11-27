/*
 * Walk Andrew's monotone chains over a lexicographically sorted planar
 * projection. Retain the original point references and omit each chain's
 * terminal corner. Callers own degenerate results and duplicate handling.
 */
export function walkSortedPlanarHull<
  X extends string | number,
  Y extends string | number,
  Point extends Readonly<Record<X | Y, number>>,
>(sorted: readonly Point[], x: X, y: Y): Point[] {
  /*
   * Cross product of the two projected displacements from the first point.
   */
  function turn(o: Point, a: Point, b: Point): number {
    return (a[x] - o[x]) * (b[y] - o[y]) - (a[y] - o[y]) * (b[x] - o[x]);
  }

  /*
   * Walk one side of the hull and leave its last corner for the other side.
   */
  function chain(first: number, end: number, step: 1 | -1): Point[] {
    const out: Point[] = [];
    for (let index: number = first; index !== end; index += step) {
      const p: Point = sorted[index]!;
      while (
        out.length >= 2 &&
        turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
      )
        out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  }

  const lower: Point[] = chain(0, sorted.length, 1);
  const upper: Point[] = chain(sorted.length - 1, -1, -1);
  for (const point of upper) lower.push(point);
  return lower;
}
