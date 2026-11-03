/**
 * The taut tape round a leg section: the perimeter of the convex hull of its
 * points in the section plane (Andrew's monotone chain), which is what a tape
 * measure pulled round the limb reads (`docs/generalization.md`, Tapes).
 */
export namespace AutoMovieHumanLegHull {
  /**
   * The taut girth of planar points.
   *
   * @param points Section points `[x, z]`, mm, in any order.
   * @returns Perimeter of their convex hull, mm; 0 for fewer than three points.
   */
  export function girth(points: readonly (readonly [number, number])[]): number {
    const p: (readonly [number, number])[] = [...points].sort((u: readonly [number, number], v: readonly [number, number]): number => u[0] - v[0] || u[1] - v[1]);
    if (p.length < 3) return 0;
    const turn = (o: readonly [number, number], a: readonly [number, number], b: readonly [number, number]): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const chain = (list: (readonly [number, number])[]): (readonly [number, number])[] => {
      const out: (readonly [number, number])[] = [];
      for (const q of list) {
        while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
        out.push(q);
      }
      return out;
    };
    const ring: (readonly [number, number])[] = [...chain(p).slice(0, -1), ...chain([...p].reverse()).slice(0, -1)];
    let sum: number = 0;
    ring.forEach((q: readonly [number, number], i: number): void => {
      const r: readonly [number, number] = ring[(i + 1) % ring.length]!;
      sum += Math.hypot(r[0] - q[0], r[1] - q[1]);
    });
    return sum;
  }
}
