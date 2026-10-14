import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import type { AutoMovieHumanBodySimpleParameter } from "../structures/AutoMovieHumanBodySimpleParameter";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
import type { IHumanBodySimpleShapeFatReading } from "./IHumanBodySimpleShapeFatReading";

/**
 * The arithmetic the simple tier's expansion and projection share: the
 * piecewise-linear curves of the table, their inverses, the derived fat
 * and developed muscle parameters, density, and the term rows evaluated on
 * a parameter record.
 *
 * Kept apart from the two public functions so that each of them reads as
 * the sequence they implement and so a curve or a fat estimate
 * has one implementation to test.
 */
export const humanBodySimpleShapeMath: {
  /** Endpoint-held interpolation over the supplied ascending curve. */
  curve(points: [number, number][], x: number): number;
  /** First bracketed inverse, with visited descending intervals refused. */
  invert(samples: [number, number][], y: number): number | null;
  /** Endpoint-clamped inverse of the supplied increasing curve. */
  invertCurve(points: [number, number][], y: number): number;
  /** Age-conditioned table estimate and essential-fat excess. */
  fat(simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears">, bodyMassIndex: number): IHumanBodySimpleShapeFatReading;
  /** Authored age-conditioned training ramp. */
  maturity(simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears">): number;
  /** Requested muscle control scaled by the training ramp. */
  developedMuscle(simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears" | "muscle">): number;
  /** Definition-gate excess after the authored muscle contribution. */
  visibleFat(simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears" | "muscle">, bodyMassIndex: number): number;
  /** Derived scalar parameters consumed by term rows. */
  parameters(simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears" | "statureMetres" | "massKilograms" | "muscle">): Record<AutoMovieHumanBodySimpleParameter, number>;
  /** Gain multiplied by all supplied row curves. */
  term(row: (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number], parameters: Record<AutoMovieHumanBodySimpleParameter, number>): number;
  /** Table-bounded Siri density in kilograms per litre. */
  density(fatPercent: number): number;
} = {
  /** A piecewise-linear curve through ascending points, flat outside them. */
  curve(points: [number, number][], x: number): number {
    if (x <= points[0][0]) return points[0][1];
    for (let i: number = 1; i < points.length; i++)
      if (x <= points[i][0]) {
        const [x0, y0]: [number, number] = points[i - 1];
        const [x1, y1]: [number, number] = points[i];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    return points[points.length - 1][1];
  },

  /**
   * The abscissa at which an increasing sampled curve reaches `y`, or null
   * outside its reach. Visited descending intervals refuse, but returning
   * the first bracket leaves later intervals unchecked; the caller must
   * supply an increasing response rather than infer global monotonicity.
   */
  invert(samples: [number, number][], y: number): number | null {
    for (let i: number = 1; i < samples.length; i++) {
      const [x0, y0]: [number, number] = samples[i - 1];
      const [x1, y1]: [number, number] = samples[i];
      if (y1 < y0)
        throw new Error(
          "A simple body parameter needs a channel that grows with its weight.",
        );
      if (y >= y0 && y <= y1)
        return y1 === y0 ? x0 : x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    }
    return null;
  },

  /** The abscissa of an increasing curve at `y`, clamped to the curve's ends. */
  invertCurve(points: [number, number][], y: number): number {
    if (y <= points[0][1]) return points[0][0];
    const found: number | null = humanBodySimpleShapeMath.invert(points, y);
    return found ?? points[points.length - 1][0];
  },

  /** Deurenberg's age-specific body fat estimate and the excess the definition gates read. */
  fat(
    simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears">,
    bodyMassIndex: number,
  ): IHumanBodySimpleShapeFatReading {
    const table: typeof HUMAN_BODY_SIMPLE_SHAPE.fat = HUMAN_BODY_SIMPLE_SHAPE.fat;
    const estimate: (model: typeof table.pediatric) => number = (model: typeof table.pediatric): number =>
      model.bodyMassIndex * bodyMassIndex +
      model.ageYears * simple.ageYears +
      (model.male * (simple.sex + 1)) / 2 +
      model.intercept;
    const [childEnd, adultStart]: [number, number] = table.transitionAgeYears;
    const percent: number =
      simple.ageYears <= childEnd
        ? estimate(table.pediatric)
        : simple.ageYears >= adultStart
          ? estimate(table.adult)
          : estimate(table.pediatric) +
            ((simple.ageYears - childEnd) / (adultStart - childEnd)) *
              (estimate(table.adult) - estimate(table.pediatric));
    return {
      percent,
      excess:
        percent -
        humanBodySimpleShapeMath.curve(table.essentialBySex, simple.sex),
    };
  },

  /**
   * The table owner's authored training factor, zero before its start age,
   * one after its end age and linear between. This numerical ramp measures
   * neither an individual's maturity nor a physiological zero response.
   */
  maturity(
    simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears">,
  ): number {
    const table: typeof HUMAN_BODY_SIMPLE_SHAPE.maturity = HUMAN_BODY_SIMPLE_SHAPE.maturity;
    const start: number = humanBodySimpleShapeMath.curve(
      table.startAgeYears,
      simple.sex,
    );
    const end: number = humanBodySimpleShapeMath.curve(table.endAgeYears, simple.sex);
    return Math.min(1, Math.max(0, (simple.ageYears - start) / (end - start)));
  },

  /** The muscle parameter as far as the body has matured to build it. */
  developedMuscle(
    simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears" | "muscle">,
  ): number {
    return simple.muscle * humanBodySimpleShapeMath.maturity(simple);
  },

  /**
   * The excess fat the definition gates read, above essential fat: the
   * regression's estimate less the fat-free mass the developed muscle adds
   * (a trained body at the same mass index carries less fat; a child, who
   * has not built it, keeps the regression), never below one point over
   * essential fat. The mass model's density keeps the regression's estimate.
   */
  visibleFat(
    simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears" | "muscle">,
    bodyMassIndex: number,
  ): number {
    const { excess }: IHumanBodySimpleShapeFatReading = humanBodySimpleShapeMath.fat(simple, bodyMassIndex);
    const added: number =
      humanBodySimpleShapeMath.developedMuscle(simple) *
      humanBodySimpleShapeMath.curve(
        HUMAN_BODY_SIMPLE_SHAPE.fat.muscleFatFreeMassIndex,
        simple.sex,
      );
    return Math.max(1, excess - (100 * added) / bodyMassIndex);
  },

  /** The parameter record the term curves are read over. */
  parameters(
    simple: Pick<
      IAutoMovieHumanBodySimpleShape,
      "sex" | "ageYears" | "statureMetres" | "massKilograms" | "muscle"
    >,
  ): Record<AutoMovieHumanBodySimpleParameter, number> {
    const bodyMassIndex: number =
      simple.massKilograms / (simple.statureMetres * simple.statureMetres);
    return {
      sex: simple.sex,
      ageYears: simple.ageYears,
      bodyMassIndex,
      muscle: simple.muscle,
      developedMuscle: humanBodySimpleShapeMath.developedMuscle(simple),
      excessFatPercent: humanBodySimpleShapeMath.visibleFat(
        simple,
        bodyMassIndex,
      ),
    };
  },

  /** One term row's contribution: its gain times the product of its curves. */
  term(
    row: (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number],
    parameters: Record<AutoMovieHumanBodySimpleParameter, number>,
  ): number {
    return row.curves.reduce(
      (total: number, curve: (typeof row.curves)[number]): number =>
        total *
        humanBodySimpleShapeMath.curve(
          curve.points,
          parameters[curve.parameter],
        ),
      row.gain,
    );
  },

  /** Siri's density, kg/L, at a fat fraction held inside the model's trusted band. */
  density(fatPercent: number): number {
    const table: typeof HUMAN_BODY_SIMPLE_SHAPE.mass = HUMAN_BODY_SIMPLE_SHAPE.mass;
    const fat: number = Math.min(
      table.fatFraction[1],
      Math.max(table.fatFraction[0], fatPercent / 100),
    );
    return table.siri.numerator / (fat + table.siri.offset);
  },
};
