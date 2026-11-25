import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

const { add, cross, dot, norm, scale, sub, unit } = AutoMovieSolidVector;

/**
 * A split's curved seam (`IAutoMovieConstructionSplit.IProfile`): the curve
 * both bands start from in place of the straight chord. Its local frame holds
 * the chord and the host end's outward normal, with a third direction for
 * measured spatial guides.
 *
 * The curve is the clamped cubic spline, on chord-length parameters (mm)
 * between its knots, so it is parameterized by its own course and may run out
 * along the host before it turns across the end, through the seam's first end
 * (the host's end ring at phase `a`), the authored knots and its second end
 * (phase `b`). At each end its unit tangent is the line where the host's
 * tangent plane meets the seam plane: out of the host at the first end, into it
 * at the second. The seam therefore leaves both forks along the host's own
 * surface. Columns read it at equal arclength shares.
 */
export namespace AutoMovieConstructionSplitSeam {
  /**
   * Build the seam, or the reason it cannot be built.
   *
   * @param input.host The host face's surface.
   * @param input.station The host's end station, mm.
   * @param input.into The station's sign out of the host.
   * @param input.seam The seam's host phases `[a, b]`, radians.
   * @param input.normal The host end section's unit normal out of the host.
   * @param input.knots The interior knots `[along, depth, lateral?]`, mm.
   * @param input.heading A direction the plane holds in place of the end normal
   *   (`IAutoMovieConstructionSplit.IProfile.heading`), or absent.
   * @returns The seam, or the refusal.
   */
  export function create(
    input: IAutoMovieConstructionSplitSeam.ICreateInput,
  ): IAutoMovieConstructionSplitSeam.ISeam | string {
    const first: IAutoMovieSolidSurface.IJet = input.host.jet(
      input.station,
      input.seam[0],
    );
    const second: IAutoMovieSolidSurface.IJet = input.host.jet(
      input.station,
      input.seam[1],
    );
    const A: AutoMovieVector3Tuple = [first.p[0]!, first.p[1]!, first.p[2]!];
    const B: AutoMovieVector3Tuple = [second.p[0]!, second.p[1]!, second.p[2]!];
    const chord: number = norm(sub(B, A));
    const e1: AutoMovieVector3Tuple | null = unit(sub(B, A));
    if (e1 === null) return "the seam's ends coincide";
    // The plane's second axis: the declared heading, or the end normal, square to the chord and out of the host.
    const toward: AutoMovieVector3Tuple = input.heading ?? input.normal;
    const square: AutoMovieVector3Tuple | null = unit(
      sub(toward, scale(e1, dot(toward, e1))),
    );
    if (square === null)
      return input.heading === undefined
        ? "the host end's normal runs along the chord, so no seam plane stands"
        : "the seam's heading runs along the chord, so no seam plane stands";
    const e2: AutoMovieVector3Tuple =
      dot(square, input.normal) < 0 ? scale(square, -1) : square;
    const normal: AutoMovieVector3Tuple = cross(e1, e2);
    const components = [0, 1, 2] as const;
    const vector = (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
      add(add(scale(e1, p[0]), scale(e2, p[1])), scale(normal, p[2]));

    // Knots in the plane's coordinates: (along e1 from A, along e2), mm. The
    // spline below is parameterized by chord length between knots, so a knot
    // need not advance along the chord: a seam may first run out along the
    // host before it turns across the end. Each knot stays within the
    // chord's span; coincident neighbours are refused with the spans below.
    const points: AutoMovieVector3Tuple[] = [[0, 0, 0]];
    for (const [along, depth, lateral = 0] of input.knots) {
      if (
        !(
          Number.isFinite(along) &&
          Number.isFinite(depth) &&
          Number.isFinite(lateral)
        )
      )
        return `the seam's knot (${along}, ${depth}, ${lateral}) mm is not finite`;
      if (!(along >= 0 && along <= chord))
        return `the seam's knot (${along}, ${depth}) mm stands beyond the chord's span [0, ${chord}] mm`;
      points.push([along, depth, lateral]);
    }
    points.push([chord, 0, 0]);

    // End tangents: the host's tangent plane meets the seam plane along
    // `n_host x n_seam`, oriented along the host's station out of it.
    const tangent: (
      j: IAutoMovieSolidSurface.IJet,
      sign: 1 | -1,
      route: AutoMovieVector3Tuple | undefined,
    ) => AutoMovieVector3Tuple | null = (
      j: IAutoMovieSolidSurface.IJet,
      sign: 1 | -1,
      route: AutoMovieVector3Tuple | undefined,
    ): AutoMovieVector3Tuple | null => {
      const u: AutoMovieVector3Tuple = [j.u[0]!, j.u[1]!, j.u[2]!];
      const v: AutoMovieVector3Tuple = [j.v[0]!, j.v[1]!, j.v[2]!];
      if (input.observed === true) {
        const plane: AutoMovieVector3Tuple | null = unit(cross(u, v));
        const transverse: AutoMovieVector3Tuple | null = unit(
          scale(sub(u, scale(v, dot(u, v) / dot(v, v))), input.into),
        );
        if (plane === null || transverse === null) return null;
        // A spatial seam need not start in the divider plane. Its first
        // supported source direction is projected into the exact parent
        // tangent plane. A direction into kept parent material cannot bound
        // the new patch, so the parent's own transverse line supplies it.
        const measured: AutoMovieVector3Tuple | null =
          route === undefined
            ? null
            : unit(sub(route, scale(plane, dot(route, plane))));
        const out: AutoMovieVector3Tuple = scale(
          measured !== null && dot(measured, transverse) > 0
            ? measured
            : transverse,
          sign,
        );
        return [dot(out, e1), dot(out, e2), dot(out, normal)];
      }
      const along: AutoMovieVector3Tuple | null = unit(
        cross(cross(u, v), normal),
      );
      // A direction square to the station derivative runs along the end
      // ring: it cannot leave the host.
      if (along === null || !(Math.abs(dot(along, u)) > 0)) return null;
      const out: AutoMovieVector3Tuple = scale(
        along,
        Math.sign(dot(along, u)) * input.into * sign,
      );
      return [dot(out, e1), dot(out, e2), 0];
    };
    const found: boolean = points.length > 2;
    const start: AutoMovieVector3Tuple | null = tangent(
      first,
      1,
      found ? vector(sub(points[1]!, points[0]!)) : undefined,
    );
    const finish: AutoMovieVector3Tuple | null = tangent(
      second,
      -1,
      found
        ? vector(sub(points[points.length - 2]!, points.at(-1)!))
        : undefined,
    );
    if (start === null || finish === null)
      return "the host's tangent plane at a fork holds no direction of the seam plane leaving its end";

    // The clamped cubic spline on chord-length parameters: interior
    // derivatives from the C2 condition, ends the unit tangents.
    const K: number = points.length;
    const h: number[] = Array.from(
      { length: K - 1 },
      (_: unknown, i: number): number =>
        Math.hypot(...sub(points[i + 1]!, points[i]!)),
    );
    if (!h.every((x: number): boolean => x > 0))
      return "two of the seam's knots coincide";
    const D: AutoMovieVector3Tuple[] = [
      start,
      ...Array.from({ length: K - 2 }, (): AutoMovieVector3Tuple => [0, 0, 0]),
      finish,
    ];
    for (const c of components) {
      // h_i D_{i-1} + 2 (h_{i-1} + h_i) D_i + h_{i-1} D_{i+1} = 3 (h_i dP_{i-1} / h_{i-1} + h_{i-1} dP_i / h_i), i = 1..K-2.
      const n: number = K - 2;
      if (n === 0) break;
      const lower: number[] = [];
      const diag: number[] = [];
      const upper: number[] = [];
      const rhs: number[] = [];
      for (let i: number = 1; i <= n; ++i) {
        const [hp, hn]: [number, number] = [h[i - 1]!, h[i]!];
        lower.push(hn);
        diag.push(2 * (hp + hn));
        upper.push(hp);
        let r: number =
          3 *
          ((hn * (points[i]![c] - points[i - 1]![c])) / hp +
            (hp * (points[i + 1]![c] - points[i]![c])) / hn);
        if (i === 1) r -= hn * D[0]![c];
        if (i === n) r -= hp * D[K - 1]![c];
        rhs.push(r);
      }
      // Thomas algorithm (the system is strictly diagonally dominant).
      for (let i: number = 1; i < n; ++i) {
        const w: number = lower[i]! / diag[i - 1]!;
        diag[i] = diag[i]! - w * upper[i - 1]!;
        rhs[i] = rhs[i]! - w * rhs[i - 1]!;
      }
      const x: number[] = new Array<number>(n).fill(0);
      x[n - 1] = rhs[n - 1]! / diag[n - 1]!;
      for (let i: number = n - 2; i >= 0; --i)
        x[i] = (rhs[i]! - upper[i]! * x[i + 1]!) / diag[i]!;
      for (let i: number = 0; i < n; ++i) D[i + 1]![c] = x[i]!;
    }

    // Power coefficients of each fixed Hermite span. The quadrature needs
    // only the quadratic speed polynomial, evaluated without building points.
    const spans = h.map((H, i) => {
      const a: AutoMovieVector3Tuple = points[i]!;
      const gap: AutoMovieVector3Tuple = sub(points[i + 1]!, a);
      const b: AutoMovieVector3Tuple = scale(D[i]!, H);
      const end: AutoMovieVector3Tuple = scale(D[i + 1]!, H);
      const c: AutoMovieVector3Tuple = sub(
        sub(scale(gap, 3), scale(b, 2)),
        end,
      );
      const d: AutoMovieVector3Tuple = add(sub(b, scale(gap, 2)), end);
      const dx = (axis: 0 | 1 | 2, x: number): number =>
        b[axis] + x * (2 * c[axis] + 3 * x * d[axis]);
      return {
        speed: (s: number): number => {
          const x: number = s / H;
          return Math.hypot(dx(0, x), dx(1, x), dx(2, x)) / H;
        },
        read: (s: number) => {
          const x: number = s / H;
          const value = (axis: 0 | 1 | 2): number =>
            a[axis] + x * (b[axis] + x * (c[axis] + x * d[axis]));
          const second = (axis: 0 | 1 | 2): number =>
            (2 * c[axis] + 6 * x * d[axis]) / (H * H);
          return {
            p: [value(0), value(1), value(2)] as AutoMovieVector3Tuple,
            d: [
              dx(0, x) / H,
              dx(1, x) / H,
              dx(2, x) / H,
            ] as AutoMovieVector3Tuple,
            dd: [second(0), second(1), second(2)] as AutoMovieVector3Tuple,
          };
        },
        third: (): AutoMovieVector3Tuple => scale(d, 6 / (H * H * H)),
      };
    });
    // Arclength of span i from 0 to s: 8-point Gauss-Legendre on the speed.
    const partial: (i: number, s: number) => number = (
      i: number,
      s: number,
    ): number => {
      let total: number = 0;
      for (let q: number = 0; q < 8; ++q) {
        total += GAUSS[q]![1] * spans[i]!.speed((s * (1 + GAUSS[q]![0])) / 2);
      }
      return (total * s) / 2;
    };
    const lengths: number[] = h.map((H: number, i: number): number =>
      partial(i, H),
    );
    const length: number = lengths.reduce(
      (x: number, y: number): number => x + y,
      0,
    );
    return {
      ends: [A, B],
      normal,
      length,
      at: (
        t: number,
        withBendRate = false,
      ): IAutoMovieConstructionSplitSeam.IPoint => {
        let target: number = Math.min(1, Math.max(0, t)) * length;
        let i: number = 0;
        while (i < lengths.length - 1 && target > lengths[i]!)
          target -= lengths[i++]!;
        let lo: number = 0;
        let hi: number = h[i]!;
        for (let step: number = 0; step < 52; ++step) {
          const mid: number = (lo + hi) / 2;
          if (partial(i, mid) < target) lo = mid;
          else hi = mid;
        }
        const span = spans[i]!;
        const at = span.read((lo + hi) / 2);
        const d: AutoMovieVector3Tuple | null = unit(vector(at.d));
        // The curvature vector: the span's second derivative less its part along the tangent, over the squared speed.
        const dd: AutoMovieVector3Tuple = at.dd;
        const speed: number = dot(at.d, at.d);
        const turn: number = speed > 0 ? dot(dd, at.d) / speed : 0;
        const bend: AutoMovieVector3Tuple =
          speed > 0
            ? vector(scale(sub(dd, scale(at.d, turn)), 1 / speed))
            : [0, 0, 0];
        const result: IAutoMovieConstructionSplitSeam.IPoint = {
          point: add(A, vector(at.p)),
          tangent: d ?? e1,
          bend,
        };
        if (withBendRate && d !== null && speed > 0) {
          const a = vector(dd);
          const j = vector(span.third());
          const v = Math.sqrt(speed);
          const rate = dot(a, d);
          // Differentiate (a - (a . T) T) / speed^2 through ds/dt = speed.
          result.bendRate = add(
            scale(
              sub(j, scale(d, dot(j, d) + v * dot(a, bend))),
              1 / (v * speed),
            ),
            scale(bend, (-3 * rate) / speed),
          );
        }
        return result;
      },
    };
  }

  /**
   * The straight chord between the seam's forks read as a seam, in the same
   * plane a curved one stands in, for a split into more than two whose seam
   * declares no profile.
   *
   * @param input.host The host face's surface.
   * @param input.station The host's end station, mm.
   * @param input.seam The seam's host phases `[a, b]`, radians.
   * @param input.normal The host end section's unit normal out of the host.
   * @param input.heading A direction the plane holds in place of the end normal
   *   (a composed end's bisector, `IAutoMovieConstructionSplit.ICompose`), or
   *   absent.
   * @returns The chord as a seam, or the refusal.
   */
  export function straight(
    input: IAutoMovieConstructionSplitSeam.IStraightInput,
  ): IAutoMovieConstructionSplitSeam.ISeam | string {
    const pa: readonly number[] = input.host.jet(
      input.station,
      input.seam[0],
    ).p;
    const pb: readonly number[] = input.host.jet(
      input.station,
      input.seam[1],
    ).p;
    const A: AutoMovieVector3Tuple = [pa[0]!, pa[1]!, pa[2]!];
    const B: AutoMovieVector3Tuple = [pb[0]!, pb[1]!, pb[2]!];
    const e1: AutoMovieVector3Tuple | null = unit(sub(B, A));
    if (e1 === null) return "the seam's ends coincide";
    // The plane's second axis, as `create` takes it: a composed end's bisector when one is given, else the end normal.
    const toward: AutoMovieVector3Tuple = input.heading ?? input.normal;
    const square: AutoMovieVector3Tuple | null = unit(
      sub(toward, scale(e1, dot(toward, e1))),
    );
    if (square === null)
      return input.heading === undefined
        ? "the host end's normal runs along the chord, so no seam plane stands"
        : "the seam's heading runs along the chord, so no seam plane stands";
    const e2: AutoMovieVector3Tuple =
      dot(square, input.normal) < 0 ? scale(square, -1) : square;
    const length: number = norm(sub(B, A));
    return {
      ends: [A, B],
      normal: cross(e1, e2),
      length,
      at: (
        t: number,
        withBendRate = false,
      ): IAutoMovieConstructionSplitSeam.IPoint => ({
        point: add(A, scale(e1, Math.min(1, Math.max(0, t)) * length)),
        tangent: e1,
        bend: [0, 0, 0],
        ...(withBendRate ? { bendRate: [0, 0, 0] } : {}),
      }),
    };
  }

  /** 8-point Gauss-Legendre nodes and weights on [-1, 1]. */
  const GAUSS: [number, number][] = [
    [-0.9602898564975363, 0.1012285362903763],
    [-0.7966664774136267, 0.2223810344533745],
    [-0.525532409916329, 0.3137066458778873],
    [-0.1834346424956498, 0.362683783378362],
    [0.1834346424956498, 0.362683783378362],
    [0.525532409916329, 0.3137066458778873],
    [0.7966664774136267, 0.2223810344533745],
    [0.9602898564975363, 0.1012285362903763],
  ];
}
