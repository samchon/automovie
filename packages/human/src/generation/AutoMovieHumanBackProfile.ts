import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The back's median line in the side view: the skin over the spinous
 * processes from the vertebra prominens (cervicale, C7) down to the middle of
 * the posterior superior iliac spines' dimples (PSIS, the sacrum's level),
 * and on over the sacrum, as forward places at heights. The trunk's side view
 * stands every published depth on it: the front profile is the back plus the
 * depth at each knot.
 *
 * Source: the standard values of video rasterstereography in 800 subjectively
 * healthy German adults aged 21 to 60 (407 women, mean stature 1.67 m; 393
 * men, 1.80 m), Ohlendorf D. et al., "Standard values of the upper body
 * posture in healthy adults with special regard to age, sex and BMI", Sci Rep
 * 13:873 (2023), PMC9845304, by sex (means): the kyphosis angle between the
 * surface tangents at C7 and at the thoracolumbar inflection, the lordosis
 * angle between the tangents at that inflection and at the PSIS level, the
 * thoracic bending angle of the chord C7 to the kyphosis apex from the
 * vertical, and the trunk length D, the spatial distance C7 to the PSIS
 * middle ({@link SHAPE}).
 *
 * Derivation: each curve is a circular arc, the thoracic one from C7 through
 * the kyphosis apex (vertical tangent, most posterior) to the inflection, the
 * lumbar one from the inflection through the lordosis apex (vertical tangent,
 * most anterior) to the PSIS level. On a circular arc the chord to the point
 * of vertical tangent leans half the tangent's turn, so the tangent at C7
 * leans `alpha = 2 x thoracic bending` back from the vertical, the inflection's
 * `beta = kyphosis - alpha` forward, and the PSIS level's `gamma = lordosis -
 * beta` back. The model predicts the published lumbar bending angle (kyphosis
 * apex to lordosis apex) as `beta / 2` with no further input: 14.24 degrees
 * against the published 14.25 in women and 9.42 against 10.56 in men. The two
 * radii split by the column's own lengths, thoracic 28 cm over lumbar 18 cm
 * (Gray 1918, "The Vertebral Column as a Whole": arc lengths `R1 kyphosis :
 * R2 lordosis = 28 : 18`), and their scale makes the C7 to PSIS chord the
 * person's trunk length, the survey's mean for the sex scaled by stature over
 * the sample's mean stature.
 *
 * Limits: the kyphosis and lordosis are the person's posture inputs
 * (`kyphoticAngle`, `lordoticAngle`), but the thoracic bending angle and the
 * trunk length are one population's means for the sex, the length scaled by
 * stature (the survey's own kyphosis and lordosis means stay in
 * {@link SHAPE} as the record of that population); the inflection is C1
 * between the two arcs, so a spline through
 * {@link IProfile.knots} carries the curve at C2 with zero curvature there;
 * the sacral part of the column below the lumbosacral joint is left out of the
 * radii's split; below the PSIS level the line runs on along its tangent, the
 * sacrum's base under the gluteal masses.
 */
export namespace AutoMovieHumanBackProfile {
  /** One sex's back shape, the survey's means; angles in degrees, length in mm. */
  export interface IShape {
    /** Kyphosis angle: between the surface tangents at C7 and at the thoracolumbar inflection. */
    kyphosis: number;

    /** Lordosis angle: between the tangents at the thoracolumbar inflection and at the PSIS level. */
    lordosis: number;

    /** Thoracic bending angle: the chord C7 to the kyphosis apex from the vertical. */
    thoracicBending: number;

    /** Trunk length D: the spatial distance C7 to the PSIS middle, mm. */
    trunkLength: number;

    /** The sample's mean stature, mm, that {@link trunkLength} belongs to. */
    stature: number;
  }

  /** Women and men, Ohlendorf et al. 2023, 21 to 60 years (means). */
  export const SHAPE: readonly [IShape, IShape] = [
    { kyphosis: 56.28, lordosis: 49.02, thoracicBending: 13.9, trunkLength: 453.51, stature: 1670 },
    { kyphosis: 51.29, lordosis: 31.96, thoracicBending: 16.23, trunkLength: 488.76, stature: 1800 },
  ];

  /**
   * The thoracic and lumbar columns' lengths, mm: Gray 1918's 28 cm and
   * 18 cm of a 71 cm male column; only their ratio is read.
   */
  export const COLUMN: { readonly thoracic: number; readonly lumbar: number } = { thoracic: 280, lumbar: 180 };

  /** One knot of the back line: a height, its forward place and the place's first and second derivatives in height. */
  export interface IKnot {
    /** The knot's anatomical name. */
    name: "cervicale" | "kyphosisApex" | "inflection" | "lordosisApex" | "psis";

    /** Height above the floor, mm. */
    y: number;

    /** Forward place relative to cervicale's, mm (negative behind it). */
    x: number;

    /** dx/dy, the surface's lean: positive where the line runs backward as it descends. */
    slope: number;

    /** d2x/dy2, mm^-1: the arc's own, zero at the inflection. */
    curvature: number;
  }

  /** A person's back line. */
  export interface IProfile {
    /** The five knots, from cervicale down. */
    knots: IKnot[];

    /** The thoracic and lumbar arcs' radii, mm. */
    radii: [number, number];

    /**
     * The forward place at a height relative to cervicale's, with its first
     * and second derivatives in height; above cervicale it holds cervicale's
     * tangent, below the PSIS level it runs on along that level's tangent.
     */
    at: (y: number) => [number, number, number];
  }

  /**
   * A person's back line from cervicale's height, stature, sex and posture
   * inputs: the kyphosis and lordosis angles are the person's
   * `kyphoticAngle` and `lordoticAngle` (DIERS surface tangents between the
   * inflections; their defaults are the Bioengineering 2022 Table 4 means,
   * `AutoMovieHumanBodyAnatomy`); the thoracic bending angle and the trunk
   * length stay the survey's for the sex ({@link SHAPE}). Premise: the
   * kyphosis exceeds twice the thoracic bending (the inflection leans
   * forward), and the lordosis exceeds that remainder.
   *
   * @param measures A person's resolved measures.
   */
  export function of(measures: IAutoMovieHumanBodyMeasures): IProfile {
    const shape: IShape = SHAPE[measures.sex === AutoMovieHumanSex.Female ? 0 : 1];
    const rad: number = Math.PI / 180;
    const kyphosis: number = measures.kyphoticAngle;
    const lordosis: number = measures.lordoticAngle;
    const alpha: number = 2 * shape.thoracicBending * rad;
    const beta: number = (kyphosis - 2 * shape.thoracicBending) * rad;
    const gamma: number = (lordosis - kyphosis + 2 * shape.thoracicBending) * rad;

    // Arc lengths R1 (alpha + beta) and R2 (beta + gamma) stand as the
    // thoracic and lumbar columns' lengths; with R1 = 1 the C7 to PSIS chord
    // is (dx, dy), and R1 scales it to the person's trunk length.
    const ratio: number = (COLUMN.lumbar / COLUMN.thoracic) * ((alpha + beta) / (beta + gamma));
    const dx: number = Math.cos(alpha) - Math.cos(beta) + ratio * (Math.cos(gamma) - Math.cos(beta));
    const dy: number = -(Math.sin(alpha) + Math.sin(beta)) - ratio * (Math.sin(beta) + Math.sin(gamma));
    const r1: number = (shape.trunkLength * (measures.stature / shape.stature)) / Math.hypot(dx, dy);
    const r2: number = ratio * r1;

    // Knots down the line; x relative to cervicale.
    const top: number = measures.cervicaleHeight;
    const apex: [number, number] = [r1 * (Math.cos(alpha) - 1), top - r1 * Math.sin(alpha)];
    const turn: [number, number] = [r1 * (Math.cos(alpha) - Math.cos(beta)), apex[1] - r1 * Math.sin(beta)];
    const lordotic: [number, number] = [turn[0] + r2 * (1 - Math.cos(beta)), turn[1] - r2 * Math.sin(beta)];
    const psis: [number, number] = [lordotic[0] + r2 * (Math.cos(gamma) - 1), lordotic[1] - r2 * Math.sin(gamma)];
    const knots: IKnot[] = [
      { name: "cervicale", y: top, x: 0, slope: Math.tan(alpha), curvature: 1 / (r1 * Math.cos(alpha) ** 3) },
      { name: "kyphosisApex", y: apex[1], x: apex[0], slope: 0, curvature: 1 / r1 },
      { name: "inflection", y: turn[1], x: turn[0], slope: -Math.tan(beta), curvature: 0 },
      { name: "lordosisApex", y: lordotic[1], x: lordotic[0], slope: 0, curvature: -1 / r2 },
      { name: "psis", y: psis[1], x: psis[0], slope: Math.tan(gamma), curvature: -1 / (r2 * Math.cos(gamma) ** 3) },
    ];

    // Each arc inverted for its tangent angle psi at a height: on the
    // thoracic arc sin psi = sin alpha + (y - top) / R1, on the lumbar one
    // sin psi = (turn - y) / R2 - sin beta; the lean is tan psi.
    const at = (y: number): [number, number, number] => {
      if (y >= top) return [Math.tan(alpha) * (y - top), Math.tan(alpha), 0];
      if (y >= turn[1]) {
        const psi: number = Math.asin(Math.sin(alpha) + (y - top) / r1);
        return [r1 * (Math.cos(alpha) - Math.cos(psi)), Math.tan(psi), 1 / (r1 * Math.cos(psi) ** 3)];
      }
      if (y >= psis[1]) {
        const psi: number = Math.asin((turn[1] - y) / r2 - Math.sin(beta));
        return [turn[0] + r2 * (Math.cos(psi) - Math.cos(beta)), Math.tan(psi), -1 / (r2 * Math.cos(psi) ** 3)];
      }
      return [psis[0] + Math.tan(gamma) * (y - psis[1]), Math.tan(gamma), 0];
    };
    return { knots, radii: [r1, r2], at };
  }

  /**
   * The back's forward place at a height, relative to cervicale's.
   *
   * @param measures A person's resolved measures.
   * @param height Height above the floor, mm.
   * @returns Forward place, mm, negative behind cervicale.
   */
  export function at(measures: IAutoMovieHumanBodyMeasures, height: number): number {
    return of(measures).at(height)[0];
  }
}
