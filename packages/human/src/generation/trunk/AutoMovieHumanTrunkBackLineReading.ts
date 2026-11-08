import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanTrunkComposedSection } from "./AutoMovieHumanTrunkComposedSection";

/**
 * The back midline as built, read by the surface-topography definitions
 * (DIERS formetric; Bioengineering 2022, PMC9774435, Table 4; Ohlendorf et
 * al., Sci Rep 13:873, 2023): on S00's posterior source `x(y)` (world X of
 * the skin over the spinous processes at height `y`, its jets per mm), the
 * lean `atan(dx/dy)` (positive where the line runs backward as it descends):
 *
 * - VP: the top (cervicale).
 * - kyphosis apex: the most posterior point above the natural waist.
 * - lordosis apex: the most anterior point between the buttock level plus
 *   50 mm and the kyphosis apex.
 * - ICT: the steepest backward lean from the kyphosis apex up to VP.
 * - ITL: the steepest forward lean between the two apices.
 * - ILS: the steepest backward lean from the dimples' level (DM, the PSIS
 *   level) up to the lordosis apex. DIERS measures the back's midline skin
 *   over the spinous processes and the sacrum between the lumbar dimples;
 *   below DM S00's midline is the seat bridged at the buttocks' depth, which
 *   lies posterior of the sacrum in every person, so it is not the line
 *   DIERS's angles read. The pelvic inclination is compared at DM.
 *
 * Kyphosis is the lean at ICT less the lean at ITL, lordosis the lean at
 * ILS less the lean at ITL, the thoracic bending angle the chord VP to the
 * kyphosis apex from the vertical, the lumbar bending angle the chord from
 * the kyphosis apex to the lordosis apex, the trunk inclination the chord VP
 * to ILS (VP ahead positive). Search steps are 0.25 mm.
 */
export namespace AutoMovieHumanTrunkBackLineReading {
  /** One read point. */
  export interface IPoint {
    /** Height, mm. */
    y: number;

    /** World X, mm. */
    x: number;

    /** Lean, degrees. */
    lean: number;

    /** d2x/dy2, per mm. */
    curvature: number;
  }

  /** The reading with the published values it is compared to. */
  export interface IOutput {
    /** Named points. */
    points: Record<"VP" | "ICT" | "kyphosisApex" | "ITL" | "lordosisApex" | "ILS", IPoint>;

    /** Kyphosis ICT-ITL, degrees. */
    kyphosis: number;

    /** Lordosis ITL-ILS, degrees. */
    lordosis: number;

    /** Thoracic bending angle, degrees. */
    thoracicBending: number;

    /** Lumbar bending angle, degrees. */
    lumbarBending: number;

    /** Trunk inclination VP-ILS, degrees (VP ahead positive) and mm. */
    inclination: { degrees: number; mm: number };

    /** The values compared against, with their sources. */
    published: { name: string; value: string; source: string }[];
  }

  /** Read the back line. */
  export function read(posterior: AutoMovieHumanTrunkComposedSection.IScalar, course: (y: number) => [number, number, number], heights: { top: number; waist: number; buttock: number; dimples: number }, inputs: { kyphotic: number; lordotic: number }): IOutput {
    // World X: the course's X plus the outline's offset, with their derivatives.
    const jet: (y: number) => [number, number, number] = (y: number): [number, number, number] => {
      const [x, d1, d2] = AutoMovieHumanFairOutline.evaluate(posterior.q, posterior.jets, posterior.at(y));
      const [c, c1, c2] = course(y);
      return [c + x, c1 + d1, c2 + d2];
    };
    const arg: (lo: number, hi: number, f: (y: number) => number) => number = (lo: number, hi: number, f: (y: number) => number): number => {
      let best: number = lo;
      let value: number = f(lo);
      for (let y: number = lo + 0.25; y <= hi + 1e-9; y += 0.25) {
        const v: number = f(y);
        if (v > value) {
          best = y;
          value = v;
        }
      }
      return f(hi) > value ? hi : best;
    };
    const point: (y: number) => IPoint = (y: number): IPoint => {
      const [x, d1, d2] = jet(y);
      return { y, x, lean: (Math.atan(d1) * 180) / Math.PI, curvature: d2 };
    };
    const top: number = heights.top;
    const apex: number = arg(heights.waist, top, (y: number): number => -jet(y)[0]);
    const lordosis: number = arg(heights.buttock + 50, apex, (y: number): number => jet(y)[0]);
    const points: IOutput["points"] = {
      VP: point(top),
      ICT: point(arg(apex, top, (y: number): number => jet(y)[1])),
      kyphosisApex: point(apex),
      ITL: point(arg(lordosis, apex, (y: number): number => -jet(y)[1])),
      lordosisApex: point(lordosis),
      ILS: point(arg(heights.dimples, lordosis, (y: number): number => jet(y)[1])),
    };
    const chord: (a: IPoint, b: IPoint) => number = (a: IPoint, b: IPoint): number => (Math.atan((a.x - b.x) / (a.y - b.y)) * 180) / Math.PI;
    return {
      points,
      kyphosis: points.ICT.lean - points.ITL.lean,
      lordosis: points.ILS.lean - points.ITL.lean,
      thoracicBending: chord(points.VP, points.kyphosisApex),
      lumbarBending: -chord(points.kyphosisApex, points.lordosisApex),
      inclination: { degrees: chord(points.VP, points.ILS), mm: points.VP.x - points.ILS.x },
      published: [
        { name: "kyphosis ICT-ITL", value: `${inputs.kyphotic} (input)`, source: "person input; DIERS women 50.1 +- 8.2 (Bioengineering 2022 Table 4)" },
        { name: "lordosis ITL-ILS", value: `${inputs.lordotic} (input)`, source: "person input; DIERS women 44.0 +- 8.5 (Bioengineering 2022 Table 4)" },
        { name: "thoracic bending", value: "13.9", source: "Ohlendorf et al. 2023, women's mean" },
        { name: "lumbar bending", value: "14.25", source: "Ohlendorf et al. 2023, women's mean" },
        { name: "trunk inclination VP-DM", value: "3.1 +- 2.1 deg; 25.6 +- 17.6 mm", source: "Bioengineering 2022 Table 4, women" },
        { name: "pelvic inclination (lean at ILS here)", value: "19.1 +- 8.9", source: "Bioengineering 2022 Table 4 (Pel), women" },
      ],
    };
  }
}
