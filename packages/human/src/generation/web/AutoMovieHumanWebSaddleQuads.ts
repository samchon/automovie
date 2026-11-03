import { AutoMovieHumanSeamPatch } from "../../lofting/AutoMovieHumanSeamPatch";
import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import { AutoMovieHumanWebPatch } from "./AutoMovieHumanWebPatch";
import type { AutoMovieHumanWebSides } from "./AutoMovieHumanWebSides";
import type { IAutoMovieHumanWebBoundary } from "./IAutoMovieHumanWebBoundary";

type Vec2 = [number, number];
type Vec3 = [number, number, number];

/**
 * The web about its crest as two four-sided seam patches, one on either side
 * of the crest's row, for one child on one side of one web.
 *
 * A web's skin near its crest S is the saddle chart `z = x + i y`: `x` the
 * level from the crest's row (-1 at the parent's ring, 0 at the crest, the
 * child's section at `bottom`), `y` the distance along the ring from the
 * pinch, both in margin radii. The chart's map `z -> w = sqrt(z)` is singular
 * at S, so the patches live in the branch coordinates `w = u + i v`, where the
 * web's surface is smooth. There the region the saddle owns, from the lip and
 * the child's own column to the fade column, is bounded by
 *
 * - the lip, `u = 0` from S (v = 0) to the pinch (v = 1);
 * - the parent's ring, the hyperbola `u^2 - v^2 = -1`;
 * - the fade column, the hyperbola `2 u v = fade`;
 * - the child's section, the hyperbola `u^2 - v^2 = bottom`;
 * - the child's own column, `v = 0` from S to `u = sqrt(bottom)`;
 *
 * a pentagon with a right corner at S. The crest's row `u = v` (x = 0) splits
 * it into two quadrilaterals, the upper one (lip, ring, fade, row) and the
 * lower one (row, fade, section, own column), and each is a transfinite
 * patch over its four sides (`AutoMovieHumanWebPatch`, Coons and Gordon). A
 * side's jet is the surface read along its curve and across it along the
 * ruling toward the opposite side's point of the same parameter, the
 * transfinite map's own ruling, so the across reading stays inside the
 * quadrilateral and the patch's parameter runs evenly across. Every side
 * carries the surface's tangent plane, so the two patches meet G1 along the
 * row they share and each meets its owner's skin G1 along its other sides.
 *
 * A point of the chart is placed on the patches by inverting the
 * transfinite map of the sides' branch-coordinate curves (Newton's method),
 * so a mesh keeps its rows and columns and takes the patches' points.
 */
export namespace AutoMovieHumanWebSaddleQuads {
  /** One child's saddle on one side of a web. */
  export interface IChart {
    /** The web's surface at branch coordinates `(u, v)`, `u, v >= 0`, mm. */
    surface: (u: number, v: number) => Vec3;

    /** The child's section's level in the chart, its depth below the crest over the margin's radius, positive. */
    bottom: number;

    /** The fade column's distance from the pinch along the ring, in margin radii, positive. */
    fade: number;
  }

  /** The six corners of the pentagon and its split, in branch coordinates. */
  export interface ICorners {
    /** The crest S. */
    crest: Vec2;

    /** The pinch, where the lip meets the parent's ring. */
    pinch: Vec2;

    /** Where the fade column meets the parent's ring. */
    ring: Vec2;

    /** Where the fade column meets the crest's row. */
    row: Vec2;

    /** Where the fade column meets the child's section. */
    section: Vec2;

    /** Where the child's own column meets its section. */
    column: Vec2;
  }

  /** A quadrilateral's four sides as curves of branch coordinates over [0, 1], in the patch's order. */
  export interface IQuad {
    /** From the (0, 0) corner to the (1, 0) corner. */
    bottom: (a: number) => Vec2;

    /** From (1, 0) to (1, 1). */
    right: (a: number) => Vec2;

    /** From (0, 1) to (1, 1). */
    top: (a: number) => Vec2;

    /** From (0, 0) to (0, 1). */
    left: (a: number) => Vec2;
  }

  /** The two patches' boundaries. */
  export interface IBoundaries {
    /** Lip, ring, fade and crest's row. */
    upper: AutoMovieHumanWebSides.IBoundaries;

    /** Own column, section, fade and crest's row. */
    lower: AutoMovieHumanWebSides.IBoundaries;
  }

  /** The two patches. */
  export interface IPatches {
    /** The patch between the parent's ring and the crest's row. */
    upper: AutoMovieHumanSeamPatch.IPatch;

    /** The patch between the crest's row and the child's section. */
    lower: AutoMovieHumanSeamPatch.IPatch;
  }

  /**
   * The corners: each the meeting of two of the region's curves, solved in
   * closed form.
   *
   * @param chart The child's saddle.
   */
  export function corners(chart: IChart): ICorners {
    const f: number = chart.fade;
    const b: number = chart.bottom;

    // u^2 - v^2 = -1 with 2 u v = f; u^2 - v^2 = b with 2 u v = f; u = v
    // with 2 u v = f.
    const vr: number = Math.sqrt((1 + Math.sqrt(1 + f * f)) / 2);
    const ue: number = Math.sqrt((b + Math.sqrt(b * b + f * f)) / 2);
    const d: number = Math.sqrt(f / 2);

    return {
      crest: [0, 0],
      pinch: [0, 1],
      ring: [f / (2 * vr), vr],
      row: [d, d],
      section: [ue, f / (2 * ue)],
      column: [Math.sqrt(b), 0],
    };
  }

  /**
   * The two quadrilaterals' sides as branch-coordinate curves.
   *
   * @param chart The child's saddle.
   */
  export function quads(chart: IChart): { upper: IQuad; lower: IQuad } {
    const c: ICorners = corners(chart);
    const f: number = chart.fade;
    const b: number = chart.bottom;
    const row = (a: number): Vec2 => [a * c.row[0], a * c.row[1]];

    return {
      upper: {
        bottom: (a: number): Vec2 => [0, a],
        right: (a: number): Vec2 => {
          const u: number = a * c.ring[0];

          return [u, Math.sqrt(1 + u * u)];
        },
        top: (a: number): Vec2 => {
          const v: number = c.row[1] + a * (c.ring[1] - c.row[1]);

          return [f / (2 * v), v];
        },
        left: row,
      },
      lower: {
        bottom: (a: number): Vec2 => [a * c.column[0], 0],
        right: (a: number): Vec2 => {
          const v: number = a * c.section[1];

          return [Math.sqrt(b + v * v), v];
        },
        top: (a: number): Vec2 => {
          const u: number = c.row[0] + a * (c.section[0] - c.row[0]);

          return [u, f / (2 * u)];
        },
        left: row,
      },
    };
  }

  /**
   * The two patches' four sides each, every one G1 with the surface.
   *
   * @param name Owner's name in findings, such as `foot.left.web-1`.
   * @param chart The child's saddle.
   */
  export function boundaries(name: string, chart: IChart): IBoundaries {
    const q: { upper: IQuad; lower: IQuad } = quads(chart);
    const of = (part: string, quad: IQuad): AutoMovieHumanWebSides.IBoundaries => ({
      bottom: side(name + "." + part + ".bottom", chart.surface, quad.bottom, quad.top),
      right: side(name + "." + part + ".right", chart.surface, quad.right, quad.left),
      top: side(name + "." + part + ".top", chart.surface, quad.top, quad.bottom),
      left: side(name + "." + part + ".left", chart.surface, quad.left, quad.right),
    });

    return { upper: of("upper", q.upper), lower: of("lower", q.lower) };
  }

  /**
   * The two patches.
   *
   * @param name Patch name in errors, such as `foot.left.web-1.toe.left.2`.
   * @param chart The child's saddle.
   */
  export function of(name: string, chart: IChart): IPatches {
    const sides: IBoundaries = boundaries(name, chart);

    return {
      upper: AutoMovieHumanWebPatch.of(name + ".upper", sides.upper),
      lower: AutoMovieHumanWebPatch.of(name + ".lower", sides.lower),
    };
  }

  /**
   * The patches' point at a chart place: its branch coordinates
   * `w = sqrt(x + i y)`, the quadrilateral that holds them (the upper one
   * where `v >= u`, above the crest's row), and that quadrilateral's own
   * parameters, which invert its transfinite map of branch coordinates.
   *
   * @param chart The child's saddle.
   * @param patches Its two patches.
   * @param x The level in the chart, from -1 to `bottom`.
   * @param y The distance from the pinch in margin radii, from 0 to `fade`.
   */
  export function place(chart: IChart, patches: IPatches, x: number, y: number): Vec3 {
    const h: number = Math.hypot(x, y);
    const w: Vec2 = [Math.sqrt(Math.max(0, (h + x) / 2)), Math.sqrt(Math.max(0, (h - x) / 2))];
    const q: { upper: IQuad; lower: IQuad } = quads(chart);
    const upper: boolean = w[1] >= w[0];
    const st: Vec2 = invert(upper ? q.upper : q.lower, w);
    const p: number[] = AutoMovieHumanSeamPatch.evaluate(upper ? patches.upper : patches.lower, st[0], st[1]).p;

    return [p[0]!, p[1]!, p[2]!];
  }

  /**
   * The transfinite (Coons) map of a quadrilateral's four branch-coordinate
   * curves at its own parameters.
   *
   * @param quad The quadrilateral.
   * @param s Its first parameter, along the bottom and top.
   * @param t Its second parameter, along the left and right.
   */
  function coons(quad: IQuad, s: number, t: number): Vec2 {
    const b: Vec2 = quad.bottom(s);
    const tp: Vec2 = quad.top(s);
    const l: Vec2 = quad.left(t);
    const r: Vec2 = quad.right(t);
    const p00: Vec2 = quad.bottom(0);
    const p10: Vec2 = quad.bottom(1);
    const p01: Vec2 = quad.top(0);
    const p11: Vec2 = quad.top(1);
    const at = (k: 0 | 1): number =>
      (1 - t) * b[k] +
      t * tp[k] +
      (1 - s) * l[k] +
      s * r[k] -
      ((1 - s) * (1 - t) * p00[k] + s * (1 - t) * p10[k] + (1 - s) * t * p01[k] + s * t * p11[k]);

    return [at(0), at(1)];
  }

  /**
   * The quadrilateral's own parameters of a branch-coordinate point: Newton's
   * method on the transfinite map from the middle, its Jacobian by central
   * differences, each step held inside the unit square.
   *
   * @param quad The quadrilateral.
   * @param w The point, branch coordinates.
   */
  function invert(quad: IQuad, w: Vec2): Vec2 {
    let s: number = 0.5;
    let t: number = 0.5;
    for (let i: number = 0; i < NEWTON; i++) {
      const c: Vec2 = coons(quad, s, t);
      const r: Vec2 = [c[0] - w[0], c[1] - w[1]];
      if (Math.hypot(r[0], r[1]) < TOLERANCE) break;

      // The Jacobian's columns and its inverse applied to the residual.
      const cs: Vec2 = coons(quad, s + STEP, t);
      const cm: Vec2 = coons(quad, s - STEP, t);
      const ct: Vec2 = coons(quad, s, t + STEP);
      const cn: Vec2 = coons(quad, s, t - STEP);
      const js: Vec2 = [(cs[0] - cm[0]) / (2 * STEP), (cs[1] - cm[1]) / (2 * STEP)];
      const jt: Vec2 = [(ct[0] - cn[0]) / (2 * STEP), (ct[1] - cn[1]) / (2 * STEP)];
      const det: number = js[0] * jt[1] - js[1] * jt[0];
      if (Math.abs(det) < 1e-12) break;
      s = Math.min(1, Math.max(0, s - (r[0] * jt[1] - r[1] * jt[0]) / det));
      t = Math.min(1, Math.max(0, t - (js[0] * r[1] - js[1] * r[0]) / det));
    }

    return [s, t];
  }

  /**
   * One side: the surface read along a curve of branch coordinates and
   * across it along the ruling toward the opposite side's point of the same
   * parameter. Along derivatives are central differences of step
   * {@link STEP} about a centre held a step inside the side's ends (the first
   * derivative carried back to the point by the second); across derivatives
   * are one-sided three-point differences into the quadrilateral, so every
   * reading lies inside it.
   *
   * @param owner Name in findings.
   * @param surface The web's surface in branch coordinates.
   * @param curve The side's curve over [0, 1].
   * @param opposite The opposite side's curve over [0, 1].
   */
  function side(
    owner: string,
    surface: (u: number, v: number) => Vec3,
    curve: (a: number) => Vec2,
    opposite: (a: number) => Vec2,
  ): IAutoMovieHumanWebBoundary {
    const h: number = STEP;
    const at = (a: number, s: number): Vec3 => {
      const p: Vec2 = curve(a);
      const o: Vec2 = opposite(a);

      return surface(p[0] + s * (o[0] - p[0]), p[1] + s * (o[1] - p[1]));
    };
    const across = (a: number): [number[], number[]] => {
      const f0: Vec3 = at(a, 0);
      const f1: Vec3 = at(a, h);
      const f2: Vec3 = at(a, 2 * h);

      return [
        f0.map((v: number, k: number): number => (-3 * v + 4 * f1[k]! - f2[k]!) / (2 * h)),
        f0.map((v: number, k: number): number => (v - 2 * f1[k]! + f2[k]!) / (h * h)),
      ];
    };
    const jet = (a: number): IAutoMovieHumanSeam.ISurfaceJet => {
      const c: number = Math.min(1 - h, Math.max(h, a));
      const p: Vec3 = at(a, 0);
      const cp: Vec3 = at(c + h, 0);
      const c0: Vec3 = at(c, 0);
      const cm: Vec3 = at(c - h, 0);
      const second: number[] = c0.map((v: number, k: number): number => (cp[k]! - 2 * v + cm[k]!) / (h * h));
      const first: number[] = c0.map((_: number, k: number): number => (cp[k]! - cm[k]!) / (2 * h) + (a - c) * second[k]!);
      const here: [number[], number[]] = across(a);
      const plus: number[] = across(c + h)[0];
      const minus: number[] = across(c - h)[0];

      return {
        point: [...p],
        along: first,
        alongSecond: second,
        across: here[0],
        acrossSecond: here[1],
        twist: plus.map((v: number, k: number): number => (v - minus[k]!) / (2 * h)),
      };
    };

    return { owner, jet, from: 0, to: 1, alpha: 1, beta: 0, continuity: "G1" };
  }
}

/** Step of the central differences, in the sides' and quadrilaterals' parameters (each runs over [0, 1]). */
const STEP: number = 1e-3;

/** Newton steps of a chart place's inversion. */
const NEWTON: number = 30;

/** Branch-coordinate residual a chart place's inversion stops at. */
const TOLERANCE: number = 1e-10;
