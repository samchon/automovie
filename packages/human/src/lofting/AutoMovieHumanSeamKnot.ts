import { AutoMovieHumanSeam } from "./AutoMovieHumanSeam";
import type { IAutoMovieHumanSeam } from "./IAutoMovieHumanSeam";

/**
 * Knot jets of a uniform periodic cubic B-spline section, and the assembly of
 * a section from guides and sectors (rule J2).
 *
 * At a knot of spacing h the curve and its derivatives depend on the three
 * control points around it alone:
 *
 * ```text
 * p   = (P- + 4 P0 + P+) / 6
 * p'  = (P+ - P-) / (2 h)
 * p'' = (P- - 2 P0 + P+) / h^2
 * ```
 *
 * and the map is invertible, `P0 = p - h^2 p'' / 6`,
 * `P+- = p + h^2 p'' / 3 +- h p'`. So a guide that owns a knot owns its
 * point, tangent and curvature exactly by writing three control points, which
 * the global inverse filter of `AutoMovieSplineCurve.interpolate` cannot
 * do: there every control point depends on every sample. A sector between two
 * guide knots `g` and `g + k` keeps the control points `g + 2 .. g + k - 2`
 * of its own, `k - 3` of them, so a sector needs at least four spans to keep
 * any shape of its own; with four, one control point. Its own knots take
 * `P0 = p - h^2 p'' / 6` from the sector's curve, which reproduces the curve
 * exactly when the curve is itself a cubic spline on these knots and
 * otherwise is the fourth-order quasi-interpolant of it.
 *
 * The result is an ordinary chain section, `[x_0 .. x_{N-1}, z_0 .. z_{N-1}]`,
 * that every consumer reads unchanged; phases run `t = 2 pi u / N` and all
 * derivatives here are per radian of phase, so `h = 2 pi / N`.
 */
export namespace AutoMovieHumanSeamKnot {
  /** A section point with its first and second phase derivatives, `[p, p', p'']`. */
  export type Jet = [number[], number[], number[]];

  /** A guide: a knot owned by a longitudinal landmark curve. */
  export interface IGuide {
    /** Knot index in `[0, N)`. */
    knot: number;

    /** The guide's published jet in section coordinates. */
    jet: IAutoMovieHumanSeam.IArcJet;

    /** Parameter speed at the guide, mm per radian of phase. */
    speed: number;

    /** Tangential acceleration, mm per radian squared; absent means 0. */
    acceleration?: number;
  }

  /**
   * A sector between consecutive guides: its own curve over the phases of its
   * span, in section coordinates.
   */
  export interface ISector {
    /** Name in errors. */
    name: string;

    /** The sector's jet at a phase of its own knots, per radian. */
    jet: (t: number) => Jet;
  }

  /**
   * Curve jet at a knot from its three control points.
   *
   * @param before Control point `P-`.
   * @param at Control point `P0`.
   * @param after Control point `P+`.
   * @param h Knot spacing in the derivative's parameter.
   */
  export function knot(
    before: readonly number[],
    at: readonly number[],
    after: readonly number[],
    h: number,
  ): Jet {
    return [
      at.map((v: number, k: number): number => (before[k]! + 4 * v + after[k]!) / 6),
      at.map((_: number, k: number): number => (after[k]! - before[k]!) / (2 * h)),
      at.map((v: number, k: number): number => (before[k]! - 2 * v + after[k]!) / (h * h)),
    ];
  }

  /**
   * The three control points `[P-, P0, P+]` that give a knot a jet: the
   * inverse of {@link knot}.
   */
  export function controls(jet: Jet, h: number): [number[], number[], number[]] {
    const [p, d1, d2] = jet;
    const centre: number[] = p.map((v: number, k: number): number => v - (h * h * d2[k]!) / 6);
    const side = (sign: number): number[] =>
      p.map((v: number, k: number): number => v + (h * h * d2[k]!) / 3 + sign * h * d1[k]!);
    return [side(-1), centre, side(1)];
  }

  /**
   * A periodic section of N control points assembled from guides and the
   * sectors between them.
   *
   * Guide `j` writes the three control points about its knot from its jet
   * copied at its speed (`AutoMovieHumanSeam.adopt`); sector `j`, between
   * guide `j` and guide `j + 1` (cyclically), writes its own knots from its
   * curve. Refused: guides out of order, fewer than four spans between
   * consecutive guides, a sector count other than the guide count.
   *
   * @param count Control points N of the chain's section.
   * @param guides Guides by increasing knot, at least one.
   * @param sectors One per guide: sector j follows guide j.
   * @returns Section coefficients in the chain's spline layout.
   */
  export function assemble(
    count: number,
    guides: readonly IGuide[],
    sectors: readonly ISector[],
  ): number[] {
    if (guides.length === 0 || sectors.length !== guides.length)
      throw new Error("A section needs one sector after every guide");
    const h: number = (2 * Math.PI) / count;
    const points: (number[] | null)[] = new Array<number[] | null>(count).fill(null);
    guides.forEach((g: IGuide, j: number): void => {
      const next: IGuide = guides[(j + 1) % guides.length]!;
      const spans: number = (next.knot - g.knot + count) % count || count;
      if (!Number.isInteger(g.knot) || g.knot < 0 || g.knot >= count)
        throw new Error(`Guide knot ${g.knot} is not a knot of ${count}`);
      if (j + 1 < guides.length && next.knot <= g.knot)
        throw new Error("Guides must be ordered by knot");
      if (spans < 4)
        throw new Error(`Sector ${sectors[j]!.name} has ${spans} spans; a sector needs four`);

      // The guide's three control points carry its copied jet exactly.
      const [p, d1, d2] = AutoMovieHumanSeam.adopt(g.jet, g.speed, g.acceleration ?? 0);
      const [before, at, after] = controls([p, d1, d2], h);
      points[(g.knot - 1 + count) % count] = before;
      points[g.knot] = at;
      points[(g.knot + 1) % count] = after;

      // The sector's own knots take their control points from its curve.
      for (let i: number = 2; i <= spans - 2; i++) {
        const k: number = (g.knot + i) % count;
        const [q, , q2] = sectors[j]!.jet((2 * Math.PI * k) / count);
        points[k] = q.map((v: number, c: number): number => v - (h * h * q2[c]!) / 6);
      }
    });
    const xs: number[] = points.map((p: number[] | null): number => p![0]!);
    const zs: number[] = points.map((p: number[] | null): number => p![1]!);
    return [...xs, ...zs];
  }
}
