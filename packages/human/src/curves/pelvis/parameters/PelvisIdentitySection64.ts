import { AutoMovieCurveMath64 as M } from "@automovie/engine";

/** Numerical observations of actual cubic courses, distinct from supplied supports and control-hull bounds. Convex tape is a sampled XZ hull perimeter; refinement deltas are diagnostics rather than interval certificates.
 *
 * @author Samchon
 */
export namespace PelvisIdentitySection64 {
  /** Sample each span without duplicating its endpoint, build an XZ monotone-chain convex hull and sum its closed perimeter in millimetres. Cost is O(N log N) time and O(N) temporary storage for N = spans × samples; a tape bridges concavities rather than following skin arc.
   */
  export function tapeMm(
    spans: readonly M.Span[],
    samples: number = 256,
  ): number {
    const points: M.V[] = spans.flatMap((s: M.Span): M.V[] =>
      Array.from(
        { length: samples },
        (_: unknown, i: number): M.V => M.cubic(s, i / samples),
      ),
    );
    points.sort((a: M.V, b: M.V): number => a[0] - b[0] || a[2] - b[2]);
    const cross: (o: M.V, a: M.V, b: M.V) => number = (
      o: M.V,
      a: M.V,
      b: M.V,
    ): number => (a[0] - o[0]) * (b[2] - o[2]) - (a[2] - o[2]) * (b[0] - o[0]);
    const chain: (values: M.V[]) => M.V[] = (values: M.V[]): M.V[] => {
      const out: M.V[] = [];
      for (const p of values) {
        while (out.length > 1 && cross(out.at(-2)!, out.at(-1)!, p) <= 0)
          out.pop();
        out.push(p);
      }
      return out;
    };
    const hull: M.V[] = [
      ...chain(points).slice(0, -1),
      ...chain([...points].reverse()).slice(0, -1),
    ];
    return hull.reduce(
      (total: number, p: M.V, i: number): number =>
        total +
        Math.hypot(
          p[0] - hull[(i + 1) % hull.length]![0],
          p[2] - hull[(i + 1) % hull.length]![2],
        ),
      0,
    );
  }

  /** Evaluate endpoint and interior derivative-root extrema of every cubic X and Z coordinate, returning actual breadth and depth in millimetres. This is a binary64 observation, not a certified interval bound.
   */
  export function boundsMm(spans: readonly M.Span[]): {
    /** Actual lateral extent in millimetres, or the explicitly constructed course breadth in an anchor record; distinct from a control-hull extent.
     */
    breadth: number;

    /** Actual anterior/posterior extent in millimetres, or the explicitly constructed course depth in an anchor record.
     */
    depth: number;
  } {
    const extremes: number[][] = [[], [], []];
    for (const s of spans)
      for (const k of [0, 2]) {
        const a: number = -s[0][k]! + 3 * s[1][k]! - 3 * s[2][k]! + s[3][k]!;
        const b: number = 2 * (s[0][k]! - 2 * s[1][k]! + s[2][k]!);
        const c: number = s[1][k]! - s[0][k]!;
        const roots: number[] =
          a === 0
            ? b === 0
              ? []
              : [-c / b]
            : b * b - 4 * a * c < 0
              ? []
              : [
                  (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a),
                  (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a),
                ];
        extremes[k]!.push(
          s[0][k]!,
          s[3][k]!,
          ...roots
            .filter((t: number): boolean => t > 0 && t < 1)
            .map((t: number): number => M.cubic(s, t)[k]!),
        );
      }
    return {
      breadth: Math.max(...extremes[0]!) - Math.min(...extremes[0]!),
      depth: Math.max(...extremes[2]!) - Math.min(...extremes[2]!),
    };
  }
}
