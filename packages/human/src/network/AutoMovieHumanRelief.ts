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
