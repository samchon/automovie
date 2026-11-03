import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

/**
 * A junction's curvature channel: the curvature a section's guide point owns
 * and both arcs meeting there copy (`AutoMovieHumanFootArc`).
 *
 * Derived from the junction's neighbours, awaiting curvatures measured per
 * landmark: the mean, over both neighbours, of the curvature at this vertex of
 * the arc that leaves it along the tangent and reaches the neighbour, a
 * neighbour lying `a` along the tangent and `b` across it.
 *
 * - Where the neighbour lies at least as far along as across (`a >= b`), the
 *   arc is the quarter ellipse of semi-axes `a`, `b`, whose curvature at the
 *   end of its `b` axis is `b / a^2`.
 * - Where it lies nearer along than across (`a < b`), that ellipse would turn
 *   tighter than any arc that still reaches the neighbour, and its curvature
 *   grows without bound as `a` falls; the arc is then the circle tangent at the
 *   vertex through the neighbour, curvature `2 b / (a^2 + b^2)`.
 *
 * Both are `1 / a` at `a = b`, so the channel is continuous in the
 * neighbours' places, and it never exceeds `2 / b`: no section turns tighter at
 * a guide than the circle that meets its neighbour.
 */
export namespace AutoMovieHumanFootJunction {
  /**
   * The curvature toward the inside at a junction, 1/mm.
   *
   * @param p The junction's place in the section's plane.
   * @param tangent Its unit tangent in the sense the ring runs.
   * @param neighbours The two guide points next to it on the ring.
   */
  export function curvature(p: G.Vec2, tangent: G.Vec2, neighbours: G.Vec2[]): number {
    const values: number[] = neighbours
      .map((q: G.Vec2): number => {
        const d: G.Vec2 = [q[0] - p[0], q[1] - p[1]];
        const a: number = Math.abs(d[0] * tangent[0] + d[1] * tangent[1]);
        const b: number = Math.abs(d[0] * tangent[1] - d[1] * tangent[0]);

        // The ellipse's vertex while the neighbour lies far along, else the
        // circle tangent here through it; both 1 / a at a = b.
        if (a >= b) return a > EPSILON ? b / (a * a) : 0;

        return b > EPSILON ? (2 * b) / (a * a + b * b) : 0;
      })
      .filter((v: number): boolean => Number.isFinite(v));

    return values.length ? values.reduce((s: number, v: number): number => s + v, 0) / values.length : 0;
  }
}

/** An along distance below which a neighbour gives no ellipse, mm. */
const EPSILON: number = 1e-6;
