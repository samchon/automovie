/**
 * Surface arcs over the head's analytic conic section family, read before any
 * loft: the bitragion arcs of ANSUR 1988 (a taut tape from one tragion to the
 * other over a named midline point) and the horizontal head circumference.
 *
 * Section family. At height `y` above FH the head section is the four quarter
 * conics of classic conic lofting on the box (anterior `a`, lateral `b`,
 * posterior `p`) about the head axis, each quarter the unique conic from one
 * box extreme to the next with its tangents along the box sides and its
 * shoulder point at the share `rho` of the corner diagonal from the chord's
 * midpoint to the corner (Liming 1947, Conic Lofting of Streamline Bodies,
 * Aircraft Engineering 19, abstract read; the engine's `AutoMovieViewSection`
 * uses the same shoulder definition). As a rational quadratic Bézier with the
 * corner as its middle control point, that conic has the corner weight
 * `w = rho / (1 - rho)`: its point at `t = 1/2` is then `M + rho (C - M)`.
 * Its forward and lateral coordinates are each a ratio of quadratics in `t`,
 * so either coordinate inverts in closed form (one root of a quadratic).
 *
 * Arc plane. The tragia stand on the frame's Z axis (FH level, X = 0), so the
 * plane through both tragia and a midline point `P = (xP, yP)` contains the Z
 * axis; its points are `(s xP, s yP, z)`. For `s` in [0, 1] the plane meets the
 * horizontal section at height `s yP` along the line `x = s xP`, so the arc's
 * right half is `(s xP, s yP, z(s))` with `z(s)` the anterior-right quarter's
 * lateral coordinate at that `x`. At `s = 0` it is the tragion (the lateral
 * extreme at the FH level), at `s = 1` the midline point. The tape reads both
 * halves. Its length is a chord sum over `n` and `n / 2` equal steps of
 * `sigma` (`s = 1 - (1 - sigma)^2`, which removes the square-root speed at the
 * midline), Richardson-extrapolated (a chord sum of a curve smooth in its
 * parameter errs by `c h^2 + O(h^4)`).
 *
 * Lengths of a quarter conic are Gauss-Legendre quadratures of its speed,
 * which is smooth on [0, 1] for `rho` in (0, 1).
 */
export namespace AutoMovieHumanHeadPlanArcs {
  /** The section's anterior quarter at one height: box half extents and the shoulder. */
  export interface IQuarter {
    /** Extent along +X (forward), mm. */
    a: number;

    /** Extent along +Z (lateral), mm. */
    b: number;

    /** Conic shoulder share in (0, 1). */
    rho: number;
  }

  /** Steps of the finer chord sum along one arc half. */
  export const SAMPLES: number = 64;

  /** Point of the quarter conic from `(a, 0)` to `(0, b)` at its Bézier parameter `t`. */
  export function point(q: IQuarter, t: number): [number, number] {
    const w: number = q.rho / (1 - q.rho);
    const u: number = 1 - t;
    const d: number = u * u + 2 * w * t * u + t * t;
    return [(q.a * (u * u + 2 * w * t * u)) / d, (q.b * (2 * w * t * u + t * t)) / d];
  }

  /**
   * The quarter's lateral coordinate where its forward coordinate is `x`
   * (0 <= x <= a): `(a - x) p(t) = x t^2` with `p(t) = 1 + (2w - 2) t +
   * (1 - 2w) t^2`, a quadratic in `t` with one root in [0, 1].
   */
  export function lateralAt(q: IQuarter, x: number): number {
    if (x >= q.a) return 0;
    if (x <= 0) return q.b;
    const w: number = q.rho / (1 - q.rho);
    const r: number = q.a - x;
    return point(q, unitRoot(r * (1 - 2 * w) - x, r * (2 * w - 2), r))[1];
  }

  /**
   * The quarter's forward coordinate where its lateral coordinate is `z`
   * (0 <= z <= b): the denominator is `r(t) + (1 - t)^2` with
   * `r(t) = 2w t + (1 - 2w) t^2`, so `(b - z) r(t) = z (1 - t)^2`.
   */
  export function forwardAt(q: IQuarter, z: number): number {
    if (z >= q.b) return 0;
    if (z <= 0) return q.a;
    const w: number = q.rho / (1 - q.rho);
    const r: number = q.b - z;
    return point(q, unitRoot(r * (1 - 2 * w) - z, 2 * w * r + 2 * z, -z))[0];
  }

  /** Length of one quarter conic: 2 x 16-point Gauss-Legendre of its analytic speed. */
  export function quarterLength(q: IQuarter): number {
    const w: number = q.rho / (1 - q.rho);
    const speed: (t: number) => number = (t: number): number => {
      const u: number = 1 - t;
      const d: number = u * u + 2 * w * t * u + t * t;
      const dd: number = -2 * u + 2 * w * (u - t) + 2 * t;
      const nx: number = q.a * (u * u + 2 * w * t * u);
      const nz: number = q.b * (2 * w * t * u + t * t);
      const dnx: number = q.a * (-2 * u + 2 * w * (u - t));
      const dnz: number = q.b * (2 * w * (u - t) + 2 * t);
      return Math.hypot((dnx * d - nx * dd) / (d * d), (dnz * d - nz * dd) / (d * d));
    };
    return gauss(speed, 0, 0.5) + gauss(speed, 0.5, 1);
  }

  /**
   * The bitragion arc over the midline point `(xP, yP)`, both halves, mm, on
   * the section family `quarter(y)`. `xP` must be the family's own anterior
   * extent at `yP` for the arc to end on the midline.
   */
  export function bitragion(xP: number, yP: number, quarter: (y: number) => IQuarter): number {
    // The arc meets the midline square to it, where z(s) behaves like
    // sqrt(1 - s); stepping evenly in sigma with s = 1 - (1 - sigma)^2 makes
    // z smooth in sigma, so the chord sums keep their h^2 error law.
    const points: [number, number, number][] = [];
    for (let k: number = 0; k <= SAMPLES; ++k) {
      const s: number = 1 - (1 - k / SAMPLES) ** 2;
      points.push([s * xP, s * yP, lateralAt(quarter(s * yP), s * xP)]);
    }
    const chords: (step: number) => number = (step: number): number => {
      let length: number = 0;
      for (let k: number = step; k <= SAMPLES; k += step) length += Math.hypot(points[k]![0] - points[k - step]![0], points[k]![1] - points[k - step]![1], points[k]![2] - points[k - step]![2]);
      return length;
    };
    return 2 * ((4 * chords(1) - chords(2)) / 3);
  }

  /**
   * Root of a function with a sign change on [lo, hi], or null without one:
   * the Illinois modified regula falsi (Dowell and Jarratt 1971), which keeps
   * the bracket and converges superlinearly, stopped when the residual falls
   * to 1e-12 of the larger end residual or the bracket to 1e-12 of its width.
   * Bisection to the same bracket took about 40 evaluations per root, and
   * the tape solves' four Gauss-Seidel passes made it the constructor's
   * largest stage (tapes 577 ms cold, 2026-11-08 10:40).
   */
  export function root(f: (x: number) => number, lo: number, hi: number): number | null {
    let a: number = lo;
    let b: number = hi;
    let fa: number = f(a);
    let fb: number = f(b);
    if (!(fa * fb <= 0)) return null;
    if (fa === 0) return a;
    if (fb === 0) return b;
    const tolerance: number = 1e-12 * (hi - lo);
    const small: number = 1e-12 * Math.max(Math.abs(fa), Math.abs(fb));
    // The root stays between a and b: the secant point replaces b; when the
    // sign at b repeats, a's residual is halved (the Illinois step).
    for (let k: number = 0; k < 200; ++k) {
      const c: number = (a * fb - b * fa) / (fb - fa);
      const fc: number = f(c);
      if (Math.abs(fc) <= small) return c;
      if (fc * fb < 0) {
        a = b;
        fa = fb;
      } else fa /= 2;
      b = c;
      fb = fc;
      if (Math.abs(b - a) <= tolerance) return b;
    }
    return b;
  }

  /** 16-point Gauss-Legendre quadrature of `f` on [a, b]. */
  export function gauss(f: (x: number) => number, a: number, b: number): number {
    const half: number = (b - a) / 2;
    const mid: number = (a + b) / 2;
    let sum: number = 0;
    for (let k: number = 0; k < NODES.length; ++k) sum += WEIGHTS[k]! * (f(mid - half * NODES[k]!) + f(mid + half * NODES[k]!));
    return sum * half;
  }

  /** The root in [0, 1] of `A t^2 + B t + C` (the coordinate inversions above have exactly one there), by the cancellation-free quadratic formula. */
  function unitRoot(A: number, B: number, C: number): number {
    if (Math.abs(A) < 1e-14 * (Math.abs(B) + Math.abs(C))) return Math.min(1, Math.max(0, -C / B));
    const disc: number = Math.sqrt(Math.max(0, B * B - 4 * A * C));
    const qq: number = -(B + (B < 0 ? -disc : disc)) / 2;
    const r1: number = qq / A;
    const r2: number = C / qq;
    const inside: (r: number) => boolean = (r: number): boolean => r >= -1e-12 && r <= 1 + 1e-12;
    return Math.min(1, Math.max(0, inside(r1) ? r1 : r2));
  }

  /** Positive Gauss-Legendre 16-point nodes on [-1, 1]. */
  const NODES: readonly number[] = [0.0950125098376374, 0.2816035507792589, 0.4580167776572274, 0.6178762444026438, 0.755404408355003, 0.8656312023878318, 0.9445750230732326, 0.9894009349916499];

  /** Their weights. */
  const WEIGHTS: readonly number[] = [0.1894506104550685, 0.1826034150449236, 0.1691565193950025, 0.1495959888165767, 0.1246289712555339, 0.0951585116824928, 0.0622535239386479, 0.0271524594117541];
}
