import type { AutoMovieSolidIntersection } from "./AutoMovieSolidIntersection";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";

type Vec3 = AutoMovieSolidVector.Vec3;
const { add, cross, dot, scale, sub } = AutoMovieSolidVector;

/**
 * The parameter laws of an intersection trace (`AutoMovieSolidIntersection`): the fourth equation `g(P, phi, t) = 0` that fixes which point of the curve a parameter `t` names, with the derivatives the trace's Newton step and its second-order prediction read.
 *
 * The part's phase gives `g = phi - t`; the angle about a footprint's axis gives `g = (P - c) . m(t)`, `m` the half plane's normal; the loop's own arclength gives `g = (P - Q(t)) . Q'(t)`, the point's foot on the periodic cubic B-spline through equal-chord points of the walked loop.
 *
 * @evidence contracts/common.md#principled-implementation Each parameter is one scalar equation with exact derivatives, so the trace's Newton and its second-order prediction see the same law.
 * @evidence contracts/common.md#clear-and-simple-design One law interface and one builder per parameter kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A degenerate angle axis returns null instead of a made reference.
 * @evidence contracts/common.md#meaningful-documentation States each law, its derivatives and its parameter's meaning.
 * @evidence contracts/performance.md#efficient-algorithms Each law term is constant work; the arc law evaluates one spline span.
 * @evidence contracts/performance.md#reuse-equivalent-work The arc law's control points are interpolated once per walked loop.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains its control points or axis only.
 */
export namespace AutoMovieSolidTraceLaw {
  /** A parameter's equation with its derivatives. */
  export interface ILaw {
    /** `g(P, phi, t)`. */
    g(p: Vec3, phi: number, t: number): number;

    /** `[dg/dP, dg/dphi]`: the gradient in the point and the direct phase term. */
    grad(t: number): [Vec3, number];

    /** `dg/dt`. */
    gt(p: Vec3, t: number): number;

    /** `Q_g` without the part's second-order term: `2 P' . m' + (P - c) . m''`; its `Q_A . m` is added by the caller with `grad`. */
    extra(p: Vec3, dp: Vec3, t: number): number;

    /** The parameter of a point. */
    angle(p: Vec3): number;
  }

  /**
   * The law of a loop's arclength through its equal-chord points: the
   * periodic cubic B-spline `Q` through them (`AutoMovieSplineCurve`'s
   * interpolation, component by component), and `g = (P - Q(t)) . Q'(t)`,
   * whose zero is the point's foot on `Q`. With `P' = A_s s' + A_phi phi'`:
   * `g_t = -Q' . Q' + (P - Q) . Q''` and, past the terms of `J x''` and
   * `Q_A . Q'`, `d^2 g / dt^2` keeps `2 P' . Q'' - 3 Q' . Q'' + (P - Q) . Q'''`.
   *
   * @param points The loop's equal-chord points, mm.
   * @returns The law.
   */
  export function arc(points: readonly Vec3[]): ILaw {
    const n: number = points.length;
    const xy: number[] = AutoMovieSplineCurve.interpolate(points.map((p: Vec3): [number, number] => [p[0], p[1]]));
    const z: number[] = AutoMovieSplineCurve.interpolate(points.map((p: Vec3): [number, number] => [p[2], 0]));
    const control: Vec3[] = Array.from({ length: n }, (_: unknown, k: number): Vec3 => [xy[k]!, xy[n + k]!, z[k]!]);
    const at = (t: number): [Vec3, Vec3, Vec3, Vec3] => {
      const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
      const i: number = Math.min(n - 1, Math.floor(u));
      const f: number = u - i;
      const g: number = 1 - f;
      const k: number = n / (2 * Math.PI);
      const w: number[][] = [
        [(g * g * g) / 6, (3 * f * f * f - 6 * f * f + 4) / 6, (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6, (f * f * f) / 6],
        [(-g * g) / 2, (3 * f * f - 4 * f) / 2, (-3 * f * f + 2 * f + 1) / 2, (f * f) / 2],
        [g, 3 * f - 2, 1 - 3 * f, f],
        [-1, 3, -3, 1],
      ];
      const out: [Vec3, Vec3, Vec3, Vec3] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      for (let d: number = 0; d < 4; d++)
        for (let j: number = 0; j < 4; j++) {
          const c: Vec3 = control[(((i - 1 + j) % n) + n) % n]!;
          const s: number = w[d]![j]! * k ** d;
          out[d]![0] += s * c[0];
          out[d]![1] += s * c[1];
          out[d]![2] += s * c[2];
        }
      return out;
    };
    return {
      g: (p: Vec3, _phi: number, t: number): number => {
        const [q, q1] = at(t);
        return dot(sub(p, q), q1);
      },
      grad: (t: number): [Vec3, number] => [at(t)[1], 0],
      gt: (p: Vec3, t: number): number => {
        const [q, q1, q2] = at(t);
        return -dot(q1, q1) + dot(sub(p, q), q2);
      },
      extra: (p: Vec3, dp: Vec3, t: number): number => {
        const [q, q1, q2, q3] = at(t);
        return 2 * dot(dp, q2) - 3 * dot(q1, q2) + dot(sub(p, q), q3);
      },
      angle: (): number => 0,
    };
  }

  /**
   * The law of the phase or the angle parameter; the arc parameter's law needs the walked loop ({@link arc}).
   *
   * @param parameter The parameter.
   * @returns The law, or null for the arc parameter or a degenerate axis.
   */
  export function of(parameter: AutoMovieSolidIntersection.Parameter): ILaw | null {
    if (parameter.kind === "arc") return null;
    if (parameter.kind === "phase")
      return {
        g: (_p: Vec3, phi: number, t: number): number => phi - t,
        grad: (): [Vec3, number] => [[0, 0, 0], 1],
        gt: (): number => -1,
        extra: (): number => 0,
        angle: (): number => 0,
      };
    const n: Vec3 | null = AutoMovieSolidVector.unit(parameter.normal);
    if (n === null) return null;
    const e1: Vec3 | null = AutoMovieSolidVector.unit(sub(parameter.reference, scale(n, dot(parameter.reference, n))));
    if (e1 === null) return null;
    const e2: Vec3 = cross(n, e1);
    const c: Vec3 = parameter.centre;
    const d = (t: number): Vec3 => add(scale(e1, Math.cos(t)), scale(e2, Math.sin(t)));
    const m = (t: number): Vec3 => add(scale(e1, -Math.sin(t)), scale(e2, Math.cos(t)));
    return {
      g: (p: Vec3, _phi: number, t: number): number => dot(sub(p, c), m(t)),
      grad: (t: number): [Vec3, number] => [m(t), 0],
      gt: (p: Vec3, t: number): number => -dot(sub(p, c), d(t)),
      extra: (p: Vec3, dp: Vec3, t: number): number => -2 * dot(dp, d(t)) - dot(sub(p, c), m(t)),
      angle: (p: Vec3): number => Math.atan2(dot(sub(p, c), e2), dot(sub(p, c), e1)),
    };
  }
}
