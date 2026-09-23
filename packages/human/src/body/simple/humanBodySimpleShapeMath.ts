import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import type { AutoMovieHumanBodySimpleParameter } from "../structures/AutoMovieHumanBodySimpleParameter";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";

/**
 * The arithmetic the simple tier's expansion and projection share: the
 * piecewise-linear curves of the table, their inverses, the derived fat
 * parameters, the child/adult head mass share, and the term rows evaluated on
 * a parameter record.
 *
 * Kept apart from the two public functions so that each of them reads as
 * the sequence the specification states and so a curve or a fat estimate
 * has one implementation to test.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Evaluates the relations a simple parameter expands through, the same way forward and back.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Realizes the flat-ended curve, age-specific fat and head mass rules, and product-of-curves rows the specification fixes.
 */
export const humanBodySimpleShapeMath = {
  /** A piecewise-linear curve through ascending points, flat outside them. */
  curve(points: [number, number][], x: number): number {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++)
      if (x <= points[i][0]) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
      }
    return points[points.length - 1][1];
  },

  /**
   * The abscissa at which an increasing sampled curve reaches `y`, or null
   * outside its reach; a sample that falls is refused, since a channel the
   * body shrinks under as its weight grows cannot be solved on.
   */
  invert(samples: [number, number][], y: number): number | null {
    for (let i = 1; i < samples.length; i++) {
      const [x0, y0] = samples[i - 1];
      const [x1, y1] = samples[i];
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
    const found = humanBodySimpleShapeMath.invert(points, y);
    return found ?? points[points.length - 1][0];
  },

  /** Deurenberg's age-specific body fat estimate and the excess the definition gates read. */
  fat(
    simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears">,
    bodyMassIndex: number,
  ): { percent: number; excess: number } {
    const table = HUMAN_BODY_SIMPLE_SHAPE.fat;
    const estimate = (model: typeof table.pediatric): number =>
      model.bodyMassIndex * bodyMassIndex +
      model.ageYears * simple.ageYears +
      (model.male * (simple.sex + 1)) / 2 +
      model.intercept;
    const [childEnd, adultStart] = table.transitionAgeYears;
    const percent =
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

  /** Fraction of total mass above the body clip ring, with a stated study-domain bridge. */
  headAndNeckFraction(ageYears: number): number {
    const table = HUMAN_BODY_SIMPLE_SHAPE.mass.headAndNeck;
    const pediatric = (age: number): number =>
      table.pediatric.intercept +
      table.pediatric.ageYearsCoefficient * age +
      table.pediatric.ageYearsSquaredCoefficient * age * age;
    const [childEnd, adultStart] = table.transitionAgeYears;
    if (ageYears <= childEnd) return pediatric(ageYears);
    if (ageYears >= adultStart) return table.adultFraction;
    return (
      pediatric(childEnd) +
      ((ageYears - childEnd) / (adultStart - childEnd)) *
        (table.adultFraction - pediatric(childEnd))
    );
  },

  /** The parameter record the term curves are read over. */
  parameters(
    simple: Pick<
      IAutoMovieHumanBodySimpleShape,
      "sex" | "ageYears" | "statureMetres" | "massKilograms" | "muscle"
    >,
  ): Record<AutoMovieHumanBodySimpleParameter, number> {
    const bodyMassIndex =
      simple.massKilograms / (simple.statureMetres * simple.statureMetres);
    return {
      sex: simple.sex,
      ageYears: simple.ageYears,
      bodyMassIndex,
      muscle: simple.muscle,
      excessFatPercent: humanBodySimpleShapeMath.fat(simple, bodyMassIndex)
        .excess,
    };
  },

  /** One term row's contribution: its gain times the product of its curves. */
  term(
    row: (typeof HUMAN_BODY_SIMPLE_SHAPE)["terms"][number],
    parameters: Record<AutoMovieHumanBodySimpleParameter, number>,
  ): number {
    return row.curves.reduce(
      (total, curve) =>
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
    const table = HUMAN_BODY_SIMPLE_SHAPE.mass;
    const fat = Math.min(
      table.fatFraction[1],
      Math.max(table.fatFraction[0], fatPercent / 100),
    );
    return table.siri.numerator / (fat + table.siri.offset);
  },
};
