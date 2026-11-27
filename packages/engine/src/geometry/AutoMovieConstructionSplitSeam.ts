import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionSplitSeam,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidVector } from "./AutoMovieSolidVector";

const { add, cross, dot, norm, scale, sub, unit } = AutoMovieSolidVector;

/**
 * A split's curved seam (`IAutoMovieConstructionSplit.IProfile`): the curve
 * both bands start from in place of the straight chord, in the seam plane that
 * holds the chord and the host end's outward normal.
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
   * @param input.knots The interior knots `[along, depth]`, mm.
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

    // Knots in the plane's coordinates: (along e1 from A, along e2), mm. The
    // spline below is parameterized by chord length between knots, so a knot
    // need not advance along the chord: a seam may first run out along the
    // host before it turns across the end. Each knot stays within the
    // chord's span; coincident neighbours are refused with the spans below.
    const points: [number, number][] = [[0, 0]];
    for (const [along, depth] of input.knots) {
      if (!(along >= 0 && along <= chord))
        return `the seam's knot (${along}, ${depth}) mm stands beyond the chord's span [0, ${chord}] mm`;
      points.push([along, depth]);
    }
    points.push([chord, 0]);

    // End tangents: the host's tangent plane meets the seam plane along
    // `n_host x n_seam`, oriented along the host's station out of it.
    const tangent: (
      j: IAutoMovieSolidSurface.IJet,
      sign: 1 | -1,
    ) => [number, number] | null = (
      j: IAutoMovieSolidSurface.IJet,
      sign: 1 | -1,
    ): [number, number] | null => {
      const u: AutoMovieVector3Tuple = [j.u[0]!, j.u[1]!, j.u[2]!];
      const v: AutoMovieVector3Tuple = [j.v[0]!, j.v[1]!, j.v[2]!];
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
      return [dot(out, e1), dot(out, e2)];
    };
    const start: [number, number] | null = tangent(first, 1);
    const finish: [number, number] | null = tangent(second, -1);
    if (start === null || finish === null)
      return "the host's tangent plane at a fork holds no direction of the seam plane leaving its end";

    // The clamped cubic spline on chord-length parameters: interior
    // derivatives from the C2 condition, ends the unit tangents.
    const K: number = points.length;
    const h: number[] = Array.from(
      { length: K - 1 },
      (_: unknown, i: number): number =>
        Math.hypot(
          points[i + 1]![0] - points[i]![0],
          points[i + 1]![1] - points[i]![1],
        ),
    );
    if (!h.every((x: number): boolean => x > 0))
      return "two of the seam's knots coincide";
    const D: [number, number][] = [
      start,
      ...Array.from({ length: K - 2 }, (): [number, number] => [0, 0]),
      finish,
    ];
    for (const c of [0, 1] as const) {
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

    // One span's cubic Hermite on s in [0, h_i]: value and derivative.
    const span: (
      i: number,
      s: number,
    ) => { p: [number, number]; d: [number, number] } = (
      i: number,
      s: number,
    ): { p: [number, number]; d: [number, number] } => {
      const H: number = h[i]!;
      const x: number = s / H;
      const [h00, h10, h01, h11]: number[] = [
        2 * x ** 3 - 3 * x ** 2 + 1,
        x ** 3 - 2 * x ** 2 + x,
        -2 * x ** 3 + 3 * x ** 2,
        x ** 3 - x ** 2,
      ];
      const [g00, g10, g01, g11]: number[] = [
        6 * x ** 2 - 6 * x,
        3 * x ** 2 - 4 * x + 1,
        -6 * x ** 2 + 6 * x,
        3 * x ** 2 - 2 * x,
      ];
      const out: (c: 0 | 1) => [number, number] = (
        c: 0 | 1,
      ): [number, number] => [
        h00! * points[i]![c] +
          h10! * H * D[i]![c] +
          h01! * points[i + 1]![c] +
          h11! * H * D[i + 1]![c],
        (g00! * points[i]![c]) / H +
          g10! * D[i]![c] +
          (g01! * points[i + 1]![c]) / H +
          g11! * D[i + 1]![c],
      ];
      const [px, dx]: [number, number] = out(0);
      const [py, dy]: [number, number] = out(1);
      return { p: [px, py], d: [dx, dy] };
    };
    // Arclength of span i from 0 to s: 8-point Gauss-Legendre on the speed.
    const partial: (i: number, s: number) => number = (
      i: number,
      s: number,
    ): number => {
      let total: number = 0;
      for (let q: number = 0; q < 8; ++q) {
        const d: [number, number] = span(i, (s * (1 + GAUSS[q]![0])) / 2).d;
        total += GAUSS[q]![1] * Math.hypot(d[0], d[1]);
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
    const world: (p: [number, number]) => AutoMovieVector3Tuple = (
      p: [number, number],
    ): AutoMovieVector3Tuple => add(A, add(scale(e1, p[0]), scale(e2, p[1])));
    return {
      ends: [A, B],
      normal,
      length,
      at: (t: number): IAutoMovieConstructionSplitSeam.IPoint => {
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
        const at: { p: [number, number]; d: [number, number] } = span(
          i,
          (lo + hi) / 2,
        );
        const d: AutoMovieVector3Tuple | null = unit(
          add(scale(e1, at.d[0]), scale(e2, at.d[1])),
        );
        // The curvature vector: the span's second derivative less its part along the tangent, over the squared speed.
        const H: number = h[i]!;
        const x: number = (lo + hi) / 2 / H;
        const dd: [number, number] = [0, 1].map(
          (c: number): number =>
            ((12 * x - 6) * points[i]![c as 0 | 1]) / (H * H) +
            ((6 * x - 4) * D[i]![c as 0 | 1]) / H +
            ((-12 * x + 6) * points[i + 1]![c as 0 | 1]) / (H * H) +
            ((6 * x - 2) * D[i + 1]![c as 0 | 1]) / H,
        ) as [number, number];
        const speed: number = at.d[0] * at.d[0] + at.d[1] * at.d[1];
        const turn: number =
          speed > 0 ? (dd[0] * at.d[0] + dd[1] * at.d[1]) / speed : 0;
        const bend: AutoMovieVector3Tuple =
          speed > 0
            ? add(
                scale(e1, (dd[0] - turn * at.d[0]) / speed),
                scale(e2, (dd[1] - turn * at.d[1]) / speed),
              )
            : [0, 0, 0];
        return { point: world(at.p), tangent: d ?? e1, bend };
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
      at: (t: number): IAutoMovieConstructionSplitSeam.IPoint => ({
        point: add(A, scale(e1, Math.min(1, Math.max(0, t)) * length)),
        tangent: e1,
        bend: [0, 0, 0],
      }),
    };
  }

  /*
   * 8-point Gauss-Legendre nodes and weights on [-1, 1].
   */
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
