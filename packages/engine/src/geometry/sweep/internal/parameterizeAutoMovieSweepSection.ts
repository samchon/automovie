import type {
  IAutoMovieParameterizeSweepSection,
  IAutoMovieSweepSection,
} from "@automovie/interface";

/*
 * Parameterize a section curve over one closed parameter interval.
 *
 * The parameter `t` runs over `[0, 1)` and wraps; the curve is split into equal
 * parameter spans, one per segment. A superellipse has four, one per quadrant,
 * its angle parameter `p = 2 pi t` as `IAutoMovieSweepSection` defines. A
 * B-spline has one per control point, evaluated with the uniform cubic basis on
 * the four control points around it (Piegl and Tiller, The NURBS Book, 2nd ed.,
 * 1997, Section 2.2, for the uniform knot vector), so `t = k / n` lies opposite
 * control point `k`. A Bezier curve has one per anchor, evaluated with the
 * cubic Bernstein basis. A polygon has one per side, linear between corners, so
 * `t = k / n` is corner `k` exactly. Radial sections are read by direction
 * instead and are not accepted here.
 * Parameter section: The section, only read and retained by the returned closure.
 * Returns: The point at a parameter, and the number of segments.
 * Error when the section's numbers are not finite, a superellipse
 * half-axis is not positive or an exponent lies outside 1 to 20, or a
 * B-spline or polygon has fewer than three points, or a Bezier curve's point
 * count is not a positive multiple of three.
 */
export const parameterizeAutoMovieSweepSection: (
  section: Exclude<IAutoMovieSweepSection, IAutoMovieSweepSection.IRadial>,
) => IAutoMovieParameterizeSweepSection.IResult = (
  section: Exclude<IAutoMovieSweepSection, IAutoMovieSweepSection.IRadial>,
): IAutoMovieParameterizeSweepSection.IResult => {
  if (section.type === "superellipse") {
    const half: number[] = [
      section.right,
      section.up,
      section.left,
      section.down,
    ];
    half.forEach((h: number): void => {
      if (h <= 0)
        throw new Error("superellipse half-axes must be positive and finite");
    });
    section.exponents.forEach((n: number): void => {
      if (n < 1 || n > 20)
        throw new Error("superellipse exponents must lie in [1, 20]");
    });
    const cx: number = section.centre?.x ?? 0;
    const cy: number = section.centre?.y ?? 0;
    return {
      segments: 4,
      point: (t: number): IAutoMovieSweepSection.IPoint => {
        const p: number = 2 * Math.PI * (t - Math.floor(t));
        const q: number = Math.min(3, Math.floor(p / (Math.PI / 2)));
        const n: number = section.exponents[q]!;
        const c: number = Math.cos(p);
        const s: number = Math.sin(p);
        const a: number = c >= 0 ? section.right : section.left;
        const b: number = s >= 0 ? section.up : section.down;
        return {
          x: cx + a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
          y: cy + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n),
        };
      },
    };
  }
  const points: IAutoMovieSweepSection.IPoint[] = section.points;
  const m: number = points.length;
  const at = (k: number): IAutoMovieSweepSection.IPoint =>
    points[((k % m) + m) % m]!;
  if (section.type === "polygon") {
    if (m < 3) throw new Error("polygon section needs at least three points");
    return {
      segments: m,
      point: (t: number): IAutoMovieSweepSection.IPoint => {
        const x: number = (t - Math.floor(t)) * m;
        const i: number = Math.min(m - 1, Math.floor(x));
        const s: number = x - i;
        const a: IAutoMovieSweepSection.IPoint = at(i);
        const b: IAutoMovieSweepSection.IPoint = at(i + 1);
        return s === 0
          ? { x: a.x, y: a.y }
          : { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s };
      },
    };
  }
  if (section.type === "bspline") {
    if (m < 3)
      throw new Error("B-spline section needs at least three control points");
    return {
      segments: m,
      point: (t: number): IAutoMovieSweepSection.IPoint => {
        const x: number = (t - Math.floor(t)) * m;
        const i: number = Math.min(m - 1, Math.floor(x));
        const s: number = x - i;
        const w: number[] = [
          (1 - s) ** 3 / 6,
          (3 * s ** 3 - 6 * s ** 2 + 4) / 6,
          (-3 * s ** 3 + 3 * s ** 2 + 3 * s + 1) / 6,
          s ** 3 / 6,
        ];
        const p: IAutoMovieSweepSection.IPoint[] = [
          at(i - 1),
          at(i),
          at(i + 1),
          at(i + 2),
        ];
        return {
          x: w.reduce(
            (sum: number, wk: number, k: number): number => sum + wk * p[k]!.x,
            0,
          ),
          y: w.reduce(
            (sum: number, wk: number, k: number): number => sum + wk * p[k]!.y,
            0,
          ),
        };
      },
    };
  }
  if (m < 3 || m % 3 !== 0)
    throw new Error("Bezier section needs a positive multiple of three points");
  const segments: number = m / 3;
  return {
    segments,
    point: (t: number): IAutoMovieSweepSection.IPoint => {
      const x: number = (t - Math.floor(t)) * segments;
      const i: number = Math.min(segments - 1, Math.floor(x));
      const s: number = x - i;
      const r: number = 1 - s;
      const w: number[] = [r * r * r, 3 * r * r * s, 3 * r * s * s, s * s * s];
      const p: IAutoMovieSweepSection.IPoint[] = [
        at(3 * i),
        at(3 * i + 1),
        at(3 * i + 2),
        at(3 * i + 3),
      ];
      return {
        x: w.reduce(
          (sum: number, wk: number, k: number): number => sum + wk * p[k]!.x,
          0,
        ),
        y: w.reduce(
          (sum: number, wk: number, k: number): number => sum + wk * p[k]!.y,
          0,
        ),
      };
    },
  };
};
