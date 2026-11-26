import { AutoMovieSolidHeightSection as Section } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A moving physical section recovers its prescribed cubic and quartic terms.
 *
 * @evidence contracts/development/testing.md#independent-expectations Expands the cubic and the boundary-vanishing quartic directly in the physical x coordinate and differentiates at fixed x. The binary64 tolerance covers scalar Bernstein evaluation of the same small polynomial.
 * @evidence contracts/development/testing.md#distinguishing-cases Both ends have nonzero and unequal speeds. Poisoning the original boundary records checks that a prepared section owns its coordinates and rates.
 */
export function test_construction_height_section(): void {
  const base = (x: number): number => x ** 3 + 2 * x ** 2 - 4;
  const slope = (x: number): number => 3 * x ** 2 + 4 * x;
  const baseRate = (x: number): number => x ** 3 - x ** 2 + 3 * x;
  const boundary = (x: number, xRate: number): Section.IBoundary => ({
    x,
    xRate,
    height: base(x),
    heightRate: baseRate(x) + xRate * slope(x),
    slope: slope(x),
    slopeRate: 3 * x ** 2 - 2 * x + 3 + xRate * (6 * x + 4),
  });
  const left = boundary(1, 1);
  const right = boundary(4, -2);
  const coefficient = 0.25;
  const coefficientRate = -0.5;
  const section = Section.prepare(left, right, coefficient, coefficientRate);
  const transverseSecond = section.transverseSecond();
  Object.assign(left, boundary(-7, 9));
  Object.assign(right, boundary(8, 12));

  for (const x of [1, 2, 4]) {
    const a = x - 1;
    const b = 4 - x;
    const bubble = a ** 2 * b ** 2;
    const actual = section.at(x);
    const expected = [
      base(x) + coefficient * bubble,
      baseRate(x) +
        coefficientRate * bubble -
        2 * coefficient * a * b * (b + 2 * a),
      slope(x) + 2 * coefficient * a * b * (b - a),
      6 * x + 4 + 2 * coefficient * (a ** 2 + b ** 2 - 4 * a * b),
    ];
    const observed = [
      actual.height,
      actual.longitudinal,
      actual.transverse,
      transverseSecond(x),
    ];
    TestValidator.predicate(
      `physical height and derivatives at x=${x}`,
      observed.every((value, index) => Math.abs(value - expected[index]!) < 1e-12),
    );
  }
}
