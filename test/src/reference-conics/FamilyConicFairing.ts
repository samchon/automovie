import type { AutoMovieVector3Tuple } from "@automovie/interface";

/**
 * The fairness of sampled curves: the minimum-variation energy, the discrete integral of the square of the curvature's rate along the
 * curve (Moreton and Sequin, Functional Optimization for Fair Surface Design, SIGGRAPH 1992; H. P. Moreton, Minimum Curvature
 * Variation Curves, Networks, and Surfaces for Fair Free-Form Shape Design, UC Berkeley UCB/CSD-93-732, 1993).
 *
 * At a vertex the discrete curvature is the turning angle over the vertex's half edges; between two vertices the curvature's rate is
 * their difference over that same measure. Circles and straight lines, of constant curvature, have none. A curve's energy is
 * multiplied by the cube of its length, which makes it independent of scale, so a larger person's curves weigh as a smaller one's.
 *
 * A planar curve (a section ring, given its plane's normal) takes its curvature signed, so an inflection is a change of sign and its
 * variation is counted in full, as Moreton's planar minimum variation curve does; a space curve (a line along the stations) has no
 * sign and takes the unsigned turning. A curve's energy may carry a weight, the share of a window it stands for (a ring's station
 * interval over the window's length), so the sum is a discrete integral over the window and does not grow with the sampling.
 */
export namespace FamilyConicFairing {
  type V = AutoMovieVector3Tuple;

  /**
   * The scale-free minimum-variation energy of one sampled curve.
   *
   * @param points The samples, in order.
   * @param closed Whether the last sample joins the first.
   * @param plane The normal of a planar curve's plane, its curvature then signed by it; absent, the unsigned turning of a space curve.
   * @param weight The share of its window the curve stands for; absent, 1.
   * @returns The energy's residuals, one a curvature step, whose squares sum to the energy: `(k[i+1] - k[i]) sqrt(w L^3 / m_i)`.
   */
  export function residuals(points: readonly V[], closed: boolean, plane?: V, weight: number = 1): number[] {
    const n: number = points.length;
    if (n < (closed ? 4 : 4)) return [];
    const edge = (i: number): number => {
      const a: V = points[i % n]!, b: V = points[(i + 1) % n]!;
      return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    };
    const edges: number[] = Array.from({ length: closed ? n : n - 1 }, (_, i: number): number => edge(i));
    const length: number = edges.reduce((sum: number, s: number): number => sum + s, 0);
    if (!(length > 0)) return [];

    // The curvature at each interior vertex (every vertex of a closed curve): turning angle over the mean of its two edges.
    const vertices: number[] = closed ? Array.from({ length: n }, (_, i: number): number => i) : Array.from({ length: n - 2 }, (_, i: number): number => i + 1);
    const curvature: { k: number; measure: number }[] = vertices.map((i: number) => {
      const a: V = points[(i - 1 + n) % n]!, b: V = points[i]!, c: V = points[(i + 1) % n]!;
      const u: V = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w: V = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
      const cross: V = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const sign: number = plane === undefined ? 1 : cross[0] * plane[0] + cross[1] * plane[1] + cross[2] * plane[2] < 0 ? -1 : 1;
      const angle: number = sign * Math.atan2(Math.hypot(...cross), u[0] * w[0] + u[1] * w[1] + u[2] * w[2]);
      const measure: number = (Math.hypot(...u) + Math.hypot(...w)) / 2;
      return { k: angle / measure, measure };
    });
    const count: number = closed ? curvature.length : curvature.length - 1;
    const scale: number = weight * length ** 3;
    return Array.from({ length: Math.max(0, count) }, (_, j: number): number => {
      const a = curvature[j]!, b = curvature[(j + 1) % curvature.length]!;
      const measure: number = (a.measure + b.measure) / 2;
      return (b.k - a.k) * Math.sqrt(scale / measure);
    });
  }

  /** The energy of several curves: the sum of their residuals' squares. */
  export function energy(curves: readonly { points: readonly V[]; closed: boolean; plane?: V; weight?: number }[]): number {
    return curves.reduce((sum: number, curve): number =>
      sum + residuals(curve.points, curve.closed, curve.plane, curve.weight).reduce((inner: number, r: number): number => inner + r * r, 0), 0);
  }
}
