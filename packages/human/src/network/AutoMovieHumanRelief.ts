import type { IAutoMovieHumanRelief } from "./IAutoMovieHumanRelief";

/**
 * Evaluation of a relief's height field over its window.
 *
 * The window maps to the knot range of a clamped-free uniform cubic
 * B-spline in each direction: with `n` control points the parameter runs
 * over `[0, n - 3]` and control point `i` shapes the spans `i - 3 .. i`.
 * The three outer rings of control points being zero, the height and its
 * first and second derivatives vanish at and beyond the window's edge.
 */
export namespace AutoMovieHumanRelief {
  /**
   * Height of the relief at a base station and phase, with its derivatives
   * along station and phase.
   *
   * @param relief Relief to evaluate.
   * @param s Base station, mm.
   * @param t Base phase, radians, any real value.
   * @returns `[d, dd/ds, dd/dt]` in mm, mm per mm and mm per radian; zero
   *   outside the window.
   */
  export function height(
    relief: IAutoMovieHumanRelief,
    s: number,
    t: number,
  ): [number, number, number] {
    if (relief.shift !== undefined) {
      const j: number[] = jet(relief, s, t);
      return [j[0]!, j[1]!, j[2]!];
    }
    const [s0, s1] = relief.stations;
    const span: number = width(relief);
    const offset: number = wrap(t - relief.phases[0]);
    if (s <= s0 || s >= s1 || offset >= span) return [0, 0, 0];
    const u: number = ((s - s0) / (s1 - s0)) * (relief.rows - 3);
    const v: number = (offset / span) * (relief.columns - 3);
    const [iu, wu, du] = basis(u, relief.rows);
    const [iv, wv, dv] = basis(v, relief.columns);
    let d: number = 0;
    let ds: number = 0;
    let dt: number = 0;
    for (let a: number = 0; a < 4; a++)
      for (let b: number = 0; b < 4; b++) {
        const h: number = relief.heights[(iu + a) * relief.columns + iv + b]!;
        d += wu[a]! * wv[b]! * h;
        ds += du[a]! * wv[b]! * h;
        dt += wu[a]! * dv[b]! * h;
      }
    return [
      d,
      (ds * (relief.rows - 3)) / (s1 - s0),
      (dt * (relief.columns - 3)) / span,
    ];
  }

  /**
   * Height with its first and second derivatives along station and phase,
   * the lips' station map applied.
   *
   * With the map `D`, the height is `d(s + D(s, t), t)`, so by the chain
   * rule, `sigma = s + D` and `d_1`, `d_2` the field's partials in its
   * station and phase:
   *
   * ```text
   * h_s  = d_1 (1 + D_s)
   * h_t  = d_1 D_t + d_2
   * h_ss = d_11 (1 + D_s)^2 + d_1 D_ss
   * h_st = d_11 (1 + D_s) D_t + d_12 (1 + D_s) + d_1 D_st
   * h_tt = d_11 D_t^2 + 2 d_12 D_t + d_22 + d_1 D_tt
   * ```
   *
   * @returns `[h, h_s, h_t, h_ss, h_st, h_tt]`; zero outside the window.
   */
  export function jet(
    relief: IAutoMovieHumanRelief,
    s: number,
    t: number,
  ): number[] {
    const D: number[] =
      relief.shift === undefined
        ? [0, 0, 0, 0, 0, 0]
        : field(relief, relief.shift, s, t);
    const d: number[] = field(relief, relief.heights, s + D[0]!, t);
    const a: number = 1 + D[1]!;
    return [
      d[0]!,
      d[1]! * a,
      d[1]! * D[2]! + d[2]!,
      d[3]! * a * a + d[1]! * D[3]!,
      d[3]! * a * D[2]! + d[4]! * a + d[1]! * D[4]!,
      d[3]! * D[2]! * D[2]! + 2 * d[4]! * D[2]! + d[5]! + d[1]! * D[5]!,
    ];
  }

  /**
   * A tensor-product net over the window with its partials up to second
   * order in station and phase, `[f, f_s, f_t, f_ss, f_st, f_tt]`, zero
   * outside the window.
   */
  function field(
    relief: IAutoMovieHumanRelief,
    net: readonly number[],
    s: number,
    t: number,
  ): number[] {
    const [s0, s1] = relief.stations;
    const span: number = width(relief);
    const offset: number = wrap(t - relief.phases[0]);
    if (s <= s0 || s >= s1 || offset >= span) return [0, 0, 0, 0, 0, 0];
    const su: number = (relief.rows - 3) / (s1 - s0);
    const sv: number = (relief.columns - 3) / span;
    const [iu, wu, du, eu] = second(((s - s0) / (s1 - s0)) * (relief.rows - 3), relief.rows);
    const [iv, wv, dv, ev] = second((offset / span) * (relief.columns - 3), relief.columns);
    const out: number[] = [0, 0, 0, 0, 0, 0];
    for (let a: number = 0; a < 4; a++)
      for (let b: number = 0; b < 4; b++) {
        const h: number = net[(iu + a) * relief.columns + iv + b]!;
        out[0]! += wu[a]! * wv[b]! * h;
        out[1]! += du[a]! * wv[b]! * h * su;
        out[2]! += wu[a]! * dv[b]! * h * sv;
        out[3]! += eu[a]! * wv[b]! * h * su * su;
        out[4]! += du[a]! * dv[b]! * h * su * sv;
        out[5]! += wu[a]! * ev[b]! * h * sv * sv;
      }
    return out;
  }

  /** Phase width of the window, radians, in `(0, 2 pi]`. */
  export function width(relief: IAutoMovieHumanRelief): number {
    const w: number = wrap(relief.phases[1] - relief.phases[0]);
    return w === 0 ? 2 * Math.PI : w;
  }
}

/** Phase reduced to `[0, 2 pi)`. */
function wrap(t: number): number {
  const r: number = t % (2 * Math.PI);
  return r < 0 ? r + 2 * Math.PI : r;
}

/** {@link basis} with the weights' second derivatives with respect to x. */
function second(
  x: number,
  count: number,
): [number, number[], number[], number[]] {
  const [i, w, d] = basis(x, count);
  const f: number = x - i;
  return [i, w, d, [1 - f, 3 * f - 2, 1 - 3 * f, f]];
}

/**
 * First control index of the span holding parameter x, the span's four
 * weights and their derivatives with respect to x.
 */
function basis(x: number, count: number): [number, number[], number[]] {
  const i: number = Math.min(count - 4, Math.max(0, Math.floor(x)));
  const f: number = x - i;
  return [
    i,
    [
      (1 - f) ** 3 / 6,
      (3 * f ** 3 - 6 * f ** 2 + 4) / 6,
      (-3 * f ** 3 + 3 * f ** 2 + 3 * f + 1) / 6,
      f ** 3 / 6,
    ],
    [
      -((1 - f) ** 2) / 2,
      (3 * f ** 2 - 4 * f) / 2,
      (-3 * f ** 2 + 2 * f + 1) / 2,
      f ** 2 / 2,
    ],
  ];
}
