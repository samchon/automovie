import type { AutoMovieLoftContract } from "./AutoMovieLoftContract";
import { AutoMovieSolidFoot } from "./AutoMovieSolidFoot";
import { AutoMovieSolidRibbon } from "./AutoMovieSolidRibbon";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import { AutoMovieSplineCurve } from "./AutoMovieSplineCurve";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
const { dot } = AutoMovieSolidVector;

/**
 * A through-cut: an opening in the skin (the palpebral fissure, the oral
 * fissure) as a closed trim loop in the skin's own chart.
 *
 * Nothing lies behind such a cut for a blend to reach, so it is not a diff: the
 * margin is a closed curve on the surface and the chart's domain gets it as a
 * hole (Sederberg et al. 2008, watertight trims as shared parameter curves).
 * The margin's points come from the landmarks that define it (endocanthion,
 * palpebrale superius, exocanthion, palpebrale inferius and the courses
 * between them; the cheilia and the stomion line), each taken to its foot on
 * the surface (`AutoMovieSolidFoot`), and the loop is the periodic cubic
 * B-spline through the feet at uniform loop parameters
 * (`AutoMovieSplineCurve.interpolate`), so it is C2 in the chart and on
 * the skin, and passes through every foot. The skin is the surface outside the
 * loop; its tessellation stops at the loop's points, which the margin's
 * consumers (a lid band, a rolled rim, a lining) read from the same function.
 *
 * A rolled rim, where the skin turns into the opening (the lid margin's
 * rounded edge, the vermilion's inner turn), is one more blend
 * (`AutoMovieSolidBlend`) from {@link ITrim.ribbon}, the skin's jet across
 * the loop toward the hole, to the inner surface's ribbon.
 *
 * Premises: the landmarks are given in their order round the opening, all on
 * one chart sheet of the surface (no seam of its periodic phase inside the
 * opening's span, or the phases unwrapped by the guesses), and dense enough
 * that the interpolant does not cross itself, which is checked.
 */
export namespace AutoMovieSolidTrim {
  /** A trim loop on a surface. */
  export interface ITrim {
    /** The surface's name. */
    surface: string;

    /** The loop's control points `[u_0 .. u_{M-1}, v_0 .. v_{M-1}]`, the layout of `AutoMovieSplineCurve` and of a root loop. */
    loop: number[];

    /** The landmarks' feet, `[u, v]`, the loop's values at parameters `2 pi m / M`. */
    feet: [number, number][];

    /**
     * The loop at a parameter.
     *
     * @param t Loop parameter, radians, any real value.
     * @returns `[u, v, du/dt, dv/dt]`.
     */
    at(t: number): [number, number, number, number];

    /**
     * Whether a chart point lies in the opening.
     *
     * @param u First chart parameter.
     * @param v Second chart parameter, on any branch of a periodic phase.
     */
    inside(u: number, v: number): boolean;

    /**
     * The skin's ribbon across the loop toward the opening, square to the
     * loop in the surface's first fundamental form.
     *
     * @param t Loop parameter.
     * @param a Scale of the cross parameter, world mm per unit.
     */
    ribbon(t: number, a: number): AutoMovieSolidRibbon.IRibbon;
  }

  /** A trim's result. */
  export interface IResult {
    /** The trim, or null when a landmark has no foot or the loop crosses itself. */
    trim: ITrim | null;

    /** Every broken premise. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /** Samples per landmark span of the polygon the inside test reads. */
  export const DENSITY: number = 16;

  /**
   * The trim through a margin's landmarks.
   *
   * @param surface The skin surface.
   * @param landmarks The margin's points in order round the opening, at least 4, mm.
   * @param guesses Each landmark's chart point to start its foot from, in its region.
   * @param tolerance The feet's tangential tolerance, mm.
   * @returns The trim and its diagnostics.
   */
  export function create(
    surface: IAutoMovieSolidSurface,
    landmarks: readonly Readonly<Vec3>[],
    guesses: readonly (readonly [number, number])[],
    tolerance: number,
  ): IResult {
    const producer: string = `solid.trim.${surface.name}`;
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    const fail = (contract: string, detail: string): IResult => {
      diagnostics.push({ producer, level: 5, contract, detail });
      return { trim: null, diagnostics };
    };
    if (!(landmarks.length >= 4) || guesses.length !== landmarks.length)
      return fail("margin landmarks", `${landmarks.length} landmarks and ${guesses.length} guesses; at least 4, one guess each`);

    // The feet.
    const feet: [number, number][] = [];
    for (let m: number = 0; m < landmarks.length; m++) {
      const foot: AutoMovieSolidFoot.IFoot | null = AutoMovieSolidFoot.of(surface, landmarks[m]!, guesses[m]!, tolerance);
      if (foot === null) return fail("landmark foot", `no foot for landmark ${m} at ${landmarks[m]!.join(", ")}`);
      feet.push([foot.u, foot.v]);
    }
    const loop: number[] = AutoMovieSplineCurve.interpolate(feet);
    const count: number = feet.length;
    const at = (t: number): [number, number, number, number] => AutoMovieSplineCurve.evaluate(loop, count, t);

    // The dense polygon the inside test and the crossing check read.
    const polygon: [number, number][] = Array.from({ length: count * DENSITY }, (_: unknown, i: number): [number, number] => {
      const p: [number, number, number, number] = at((2 * Math.PI * i) / (count * DENSITY));
      return [p[0], p[1]];
    });
    const crossing: number = selfCrossing(polygon);
    if (crossing >= 0) return fail("simple margin", `the loop through the landmarks crosses itself at sample ${crossing}`);
    const mean: number = polygon.reduce((sum: number, p: [number, number]): number => sum + p[1], 0) / polygon.length;

    // `e = G^-1 (-dv, du)` always lies left of the loop's tangent, since
    // `det[c', G^-1 R c'] = (R c')^T G^-1 (R c') > 0` for the positive definite
    // `G^-1`; the opening is on the left of a counter-clockwise loop, so the
    // loop's signed area in the chart turns `e` toward it.
    let area: number = 0;
    for (let i: number = 0, j: number = polygon.length - 1; i < polygon.length; j = i++)
      area += polygon[j]![0] * polygon[i]![1] - polygon[i]![0] * polygon[j]![1];
    const turning: number = area > 0 ? 1 : -1;
    const inside = (u: number, v: number): boolean => {
      // The phase on the branch nearest the loop's mean, as a root loop does.
      const w: number = surface.period === undefined ? v : v + surface.period * Math.round((mean - v) / surface.period);
      let odd: boolean = false;
      for (let i: number = 0, j: number = polygon.length - 1; i < polygon.length; j = i++) {
        const a: [number, number] = polygon[i]!;
        const b: [number, number] = polygon[j]!;
        if (a[0] > u !== b[0] > u && w < ((b[1] - a[1]) * (u - a[0])) / (b[0] - a[0]) + a[1]) odd = !odd;
      }
      return odd;
    };

    // Square to the loop in the first fundamental form, of unit world speed,
    // turned toward the opening; null where the chart degenerates.
    const square = (t: number): [number, number, number, number] | null => {
      const [u, v, du, dv]: [number, number, number, number] = at(t);
      const j: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
      const E: number = dot(j.u, j.u);
      const F: number = dot(j.u, j.v);
      const G: number = dot(j.v, j.v);
      const e: [number, number] | null = AutoMovieSolidVector.solve2(E, F, F, G, [-dv, du]);
      if (e === null) return null;
      const speed: number = Math.sqrt(E * e[0] * e[0] + 2 * F * e[0] * e[1] + G * e[1] * e[1]);
      if (!(speed > 0)) return null;
      const k: number = turning / speed;
      return [u, v, e[0] * k, e[1] * k];
    };
    for (let i: number = 0; i < polygon.length; i++)
      if (square((2 * Math.PI * i) / polygon.length) === null)
        return fail("regular chart", `the surface's chart degenerates on the loop at sample ${i}`);
    const ribbon = (t: number, a: number): AutoMovieSolidRibbon.IRibbon => {
      // Checked regular at the polygon's samples; between them the chart of a
      // smooth surface stays regular.
      const [u, v, du, dv]: [number, number, number, number] = square(t) ?? [...at(t).slice(0, 2), 0, 0] as [number, number, number, number];
      return AutoMovieSolidRibbon.of(surface, u, v, du, dv, a);
    };

    return { trim: { surface: surface.name, loop, feet, at, inside, ribbon }, diagnostics };
  }

  /**
   * The first sample whose edge crosses a later non-adjacent edge of a
   * closed polygon, or -1 when it is simple.
   *
   * @param points The closed polygon.
   * @returns The sample index or -1.
   */
  function selfCrossing(points: readonly [number, number][]): number {
    const n: number = points.length;
    const turn = (a: readonly [number, number], b: readonly [number, number], c: readonly [number, number]): number =>
      (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    for (let i: number = 0; i < n; i++)
      for (let j: number = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const a: [number, number] = points[i]!;
        const b: [number, number] = points[(i + 1) % n]!;
        const c: [number, number] = points[j]!;
        const d: [number, number] = points[(j + 1) % n]!;
        if (turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0) return i;
      }
    return -1;
  }
}
