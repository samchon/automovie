import type {
  AutoMovieVector3Tuple,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidTraceLaw,
} from "@automovie/interface";

import { AutoMovieEngineSolidVector } from "./AutoMovieEngineSolidVector";
import { AutoMovieEngineSplineCurve } from "./AutoMovieEngineSplineCurve";

/**
 * The parameter laws of an intersection trace (`AutoMovieEngineSolidIntersection`):
 * the fourth equation `g(P, phi, t) = 0` that fixes which point of the curve a
 * parameter `t` names, with the derivatives the trace's Newton step and its
 * second-order prediction read.
 *
 * Phase gives g=phi-t; angle gives g=(P-c).m(t), a rotating plane equation
 * whose branch is selected by the seed/continuation. Requested arc mode uses
 * g=(P-Q(t)).Q'(t), the normal plane of a periodic spline through equal-chord
 * walked points. That guide parameter approximates arclength rather than
 * proving exact constant speed on the realized intersection.
 */
export namespace AutoMovieEngineSolidTraceLaw {
  /**
   * The reference-guide law used for requested arc parameterization through
   * equal-chord walked points; it is not an exact arclength reparameterization.
   * The periodic cubic B-spline `Q` through them (`AutoMovieEngineSplineCurve`'s
   * interpolation, component by component), and `g = (P - Q(t)) . Q'(t)`, whose
   * zero is the point's foot on `Q`. With `P' = A_s s' + A_phi phi'`: `g_t =
   * -Q' . Q' + (P - Q) . Q''` and, past the terms of `J x''` and `Q_A . Q'`,
   * `d^2 g / dt^2` keeps `2 P' . Q'' - 3 Q' . Q'' + (P - Q) . Q'''`.
   *
   * @param points The loop's equal-chord points, mm.
   * @returns The law.
   */
  export function arc(
    points: readonly AutoMovieVector3Tuple[],
  ): IAutoMovieSolidTraceLaw.ILaw {
    const n: number = points.length;
    const xy: number[] = AutoMovieEngineSplineCurve.interpolate(
      points.map((p: AutoMovieVector3Tuple): [number, number] => [p[0], p[1]]),
    );
    const z: number[] = AutoMovieEngineSplineCurve.interpolate(
      points.map((p: AutoMovieVector3Tuple): [number, number] => [p[2], 0]),
    );
    const control: AutoMovieVector3Tuple[] = Array.from(
      { length: n },
      (_: unknown, k: number): AutoMovieVector3Tuple => [
        xy[k]!,
        xy[n + k]!,
        z[k]!,
      ],
    );
    const at = (
      t: number,
    ): [
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
      AutoMovieVector3Tuple,
    ] => {
      const u: number = ((((t / (2 * Math.PI)) % 1) + 1) % 1) * n;
      const i: number = Math.min(n - 1, Math.floor(u));
      const f: number = u - i;
      const g: number = 1 - f;
      const k: number = n / (2 * Math.PI);
      const w: number[][] = [
        [
          (g * g * g) / 6,
          (3 * f * f * f - 6 * f * f + 4) / 6,
          (-3 * f * f * f + 3 * f * f + 3 * f + 1) / 6,
          (f * f * f) / 6,
        ],
        [
          (-g * g) / 2,
          (3 * f * f - 4 * f) / 2,
          (-3 * f * f + 2 * f + 1) / 2,
          (f * f) / 2,
        ],
        [g, 3 * f - 2, 1 - 3 * f, f],
        [-1, 3, -3, 1],
      ];
      const out: [
        AutoMovieVector3Tuple,
        AutoMovieVector3Tuple,
        AutoMovieVector3Tuple,
        AutoMovieVector3Tuple,
      ] = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      for (let d: number = 0; d < 4; d++)
        for (let j: number = 0; j < 4; j++) {
          const c: AutoMovieVector3Tuple =
            control[(((i - 1 + j) % n) + n) % n]!;
          const s: number = w[d]![j]! * k ** d;
          out[d]![0] += s * c[0];
          out[d]![1] += s * c[1];
          out[d]![2] += s * c[2];
        }
      return out;
    };
    return {
      g: (p: AutoMovieVector3Tuple, _phi: number, t: number): number => {
        const [q, q1] = at(t);
        return dot(sub(p, q), q1);
      },
      grad: (t: number): [AutoMovieVector3Tuple, number] => [at(t)[1], 0],
      gt: (p: AutoMovieVector3Tuple, t: number): number => {
        const [q, q1, q2] = at(t);
        return -dot(q1, q1) + dot(sub(p, q), q2);
      },
      extra: (
        p: AutoMovieVector3Tuple,
        dp: AutoMovieVector3Tuple,
        t: number,
      ): number => {
        const [q, q1, q2, q3] = at(t);
        return 2 * dot(dp, q2) - 3 * dot(q1, q2) + dot(sub(p, q), q3);
      },
      angle: (): number => 0,
    };
  }

  /**
   * The law of the phase or the angle parameter; the arc parameter's law needs
   * the walked loop ({@link arc}).
   *
   * @param parameter The parameter.
   * @returns The law, or null for the arc parameter or a degenerate axis.
   */
  export function of(
    parameter: IAutoMovieSolidIntersection.Parameter,
  ): IAutoMovieSolidTraceLaw.ILaw | null {
    if (parameter.kind === "arc") return null;
    if (parameter.kind === "phase")
      return {
        g: (_p: AutoMovieVector3Tuple, phi: number, t: number): number =>
          phi - t,
        grad: (): [AutoMovieVector3Tuple, number] => [[0, 0, 0], 1],
        gt: (): number => -1,
        extra: (): number => 0,
        angle: (): number => 0,
      };
    const n: AutoMovieVector3Tuple | null = AutoMovieEngineSolidVector.unit(
      parameter.normal,
    );
    if (n === null) return null;
    const e1: AutoMovieVector3Tuple | null = AutoMovieEngineSolidVector.unit(
      sub(parameter.reference, scale(n, dot(parameter.reference, n))),
    );
    if (e1 === null) return null;
    const e2: AutoMovieVector3Tuple = cross(n, e1);
    const c: AutoMovieVector3Tuple = parameter.centre;
    const d = (t: number): AutoMovieVector3Tuple =>
      add(scale(e1, Math.cos(t)), scale(e2, Math.sin(t)));
    const m = (t: number): AutoMovieVector3Tuple =>
      add(scale(e1, -Math.sin(t)), scale(e2, Math.cos(t)));
    return {
      g: (p: AutoMovieVector3Tuple, _phi: number, t: number): number =>
        dot(sub(p, c), m(t)),
      grad: (t: number): [AutoMovieVector3Tuple, number] => [m(t), 0],
      gt: (p: AutoMovieVector3Tuple, t: number): number =>
        -dot(sub(p, c), d(t)),
      extra: (
        p: AutoMovieVector3Tuple,
        dp: AutoMovieVector3Tuple,
        t: number,
      ): number => -2 * dot(dp, d(t)) - dot(sub(p, c), m(t)),
      angle: (p: AutoMovieVector3Tuple): number =>
        Math.atan2(dot(sub(p, c), e2), dot(sub(p, c), e1)),
    };
  }
}

const { add, cross, dot, scale, sub } = AutoMovieEngineSolidVector;
