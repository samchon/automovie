import type { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";

/**
 * Interpolation of a chain's values between two principal layers from their
 * values and station derivatives.
 *
 * A layer that carries first derivatives only is joined by the cubic
 * Hermite rule; two layers that both carry second derivatives as well are
 * joined by the quintic Hermite rule
 *
 * ```text
 * f(u) = H0 f_a + H1 H f'_a + H2 H^2 f''_a + H3 H^2 f''_b + H4 H f'_b + H5 f_b
 * ```
 *
 * with `u = (s - s_a) / H` and the quintic basis H0 .. H5, which matches
 * value, slope and curvature at both layers. A natural cubic spline's
 * interval is a cubic, which the quintic rule reproduces exactly from the
 * spline's own derivatives, so expanding a feature chain with second
 * derivatives changes no interval of the spline; it only lets an interval
 * end on a neighbour's derivatives (a shared key, a cap's end key), which
 * the redesign plan's section 2 requires for C2 joins.
 */
export namespace AutoMovieHumanStationHermite {
  /** A layer's value, slope and optional curvature for one array. */
  export interface IEnd {
    /** Values at the layer. */
    value: readonly number[];

    /** Station derivatives at the layer, per mm of station. */
    slope: readonly number[];

    /** Second station derivatives at the layer; absent for a cubic end. */
    curvature?: readonly number[];
  }

  /**
   * Weights of `[f_a, f'_a, f''_a, f''_b, f'_b, f_b]` for the value or a
   * station derivative at unit parameter u of an interval of width H.
   *
   * The slope and curvature weights already include their factors H and
   * H^2, and the derivative weights the chain rule's `1 / H^order`, so a
   * value is the plain weighted sum of the six arrays. The cubic rule puts
   * zero on both curvatures.
   *
   * @param u Unit parameter in `[0, 1]`.
   * @param H Interval width in station units.
   * @param order 0 for the value, 1 or 2 for the station derivative.
   * @param quintic Whether both layers carry curvatures.
   */
  export function weights(
    u: number,
    H: number,
    order: 0 | 1 | 2,
    quintic: boolean,
  ): number[] {
    const scale: number = 1 / H ** order;
    if (!quintic) {
      const c: number[] =
        order === 0
          ? [2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2]
          : order === 1
            ? [6 * u ** 2 - 6 * u, 3 * u ** 2 - 4 * u + 1, -6 * u ** 2 + 6 * u, 3 * u ** 2 - 2 * u]
            : [12 * u - 6, 6 * u - 4, -12 * u + 6, 6 * u - 2];
      return [c[0]! * scale, c[1]! * H * scale, 0, 0, c[3]! * H * scale, c[2]! * scale];
    }
    const q: number[] =
      order === 0
        ? [
            1 - 10 * u ** 3 + 15 * u ** 4 - 6 * u ** 5,
            u - 6 * u ** 3 + 8 * u ** 4 - 3 * u ** 5,
            0.5 * u ** 2 - 1.5 * u ** 3 + 1.5 * u ** 4 - 0.5 * u ** 5,
            0.5 * u ** 3 - u ** 4 + 0.5 * u ** 5,
            -4 * u ** 3 + 7 * u ** 4 - 3 * u ** 5,
            10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5,
          ]
        : order === 1
          ? [
              -30 * u ** 2 + 60 * u ** 3 - 30 * u ** 4,
              1 - 18 * u ** 2 + 32 * u ** 3 - 15 * u ** 4,
              u - 4.5 * u ** 2 + 6 * u ** 3 - 2.5 * u ** 4,
              1.5 * u ** 2 - 4 * u ** 3 + 2.5 * u ** 4,
              -12 * u ** 2 + 28 * u ** 3 - 15 * u ** 4,
              30 * u ** 2 - 60 * u ** 3 + 30 * u ** 4,
            ]
          : [
              -60 * u + 180 * u ** 2 - 120 * u ** 3,
              -36 * u + 96 * u ** 2 - 60 * u ** 3,
              1 - 9 * u + 18 * u ** 2 - 10 * u ** 3,
              3 * u - 12 * u ** 2 + 10 * u ** 3,
              -24 * u + 84 * u ** 2 - 60 * u ** 3,
              60 * u - 180 * u ** 2 + 120 * u ** 3,
            ];
    return [
      q[0]! * scale,
      q[1]! * H * scale,
      q[2]! * H * H * scale,
      q[3]! * H * H * scale,
      q[4]! * H * scale,
      q[5]! * scale,
    ];
  }

  /**
   * Interpolated array between two layer ends at the given weights.
   *
   * @param a Lower layer's end.
   * @param b Upper layer's end.
   * @param w Weights from {@link weights}.
   */
  export function combine(a: IEnd, b: IEnd, w: readonly number[]): number[] {
    return a.value.map(
      (v: number, k: number): number =>
        w[0]! * v +
        w[1]! * a.slope[k]! +
        (a.curvature === undefined ? 0 : w[2]! * a.curvature[k]!) +
        (b.curvature === undefined ? 0 : w[3]! * b.curvature[k]!) +
        w[4]! * b.slope[k]! +
        w[5]! * b.value[k]!,
    );
  }

  /** Whether a layer carries its plane's station derivatives. */
  export function framed(layer: IAutoMovieHumanLoftChain.ILayer): boolean {
    return layer.frame !== undefined && layer.frameSlopes !== undefined;
  }

  /**
   * A layer's plane as one array `[origin, u, v]` of nine numbers, with its
   * slopes and curvatures, for interpolation component by component.
   */
  export function frameEnd(layer: IAutoMovieHumanLoftChain.ILayer): IEnd {
    const flat = (f: AutoMovieHumanLoftFrame.IFrame): number[] => [
      ...f.origin,
      ...f.u,
      ...f.v,
    ];
    return {
      value: flat(layer.frame!),
      slope: flat(layer.frameSlopes!),
      ...(layer.frameCurvatures === undefined
        ? {}
        : { curvature: flat(layer.frameCurvatures) }),
    };
  }

  /** Plane of a nine-number array `[origin, u, v]`; the axes as interpolated, not renormalised. */
  export function unflat(x: readonly number[]): AutoMovieHumanLoftFrame.IFrame {
    return {
      origin: [x[0]!, x[1]!, x[2]!],
      u: [x[3]!, x[4]!, x[5]!],
      v: [x[6]!, x[7]!, x[8]!],
    };
  }
}
