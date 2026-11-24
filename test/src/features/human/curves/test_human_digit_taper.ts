import { AutoMovieHumanDigitSpan as Span } from "@automovie/human";

/**
 * The shared unmeasured digit taper follows a quarter ellipse and joins at the
 * phalanx boundaries.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the span and the public knots used by the toe taper.
 * @evidence contracts/development/testing.md#independent-expectations An ellipse of radial semiaxis 5 satisfies course squared plus radius squared over 25 equal to one.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes both sides of each shared knot and the narrow shaft before the tip.
 * @evidence contracts/development/testing.md#execution-ownership Fixed scalar calculations with no figure or reference fixture.
 * @evidence contracts/development/common.md#meaningful-documentation Names the curve and the joint overlap checked.
 */
export function test_human_digit_taper(): void {
  const phalanges = ["proximal", "middle", "distal"] as const;
  const failures: string[] = [];
  for (const [index, phalanx] of phalanges.entries()) {
    for (const station of [0, 0.5, 1]) {
      const section = Span.shape({ root: 5, apex: 1 }, phalanx, station);
      const course: number = (index + station) / 4;
      const equation: number = course ** 2 + (section.width / 5) ** 2;
      if (
        !(Math.abs(equation - 1) <= 16 * Number.EPSILON) ||
        section.width !== section.palmar ||
        section.width !== section.dorsal
      )
        failures.push(
          phalanx + " at " + station + " departed from the quarter ellipsoid",
        );
      if (
        station !== 0.5 &&
        section.width !== 5 * Span.KNOTS[index + station]!.width
      )
        failures.push(
          phalanx + " at " + station + " disagrees with the toe taper knot",
        );
    }
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
