import { AutoMovieArchetypeQuadrupedMotion } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * A minimum-jerk foot swing stays inside its actual endpoint and lift domain.
 *
 * Scenarios:
 *
 * 1. Literal dyadic phases recover the quintic's independently integrated
 *    coefficients and a symmetric lift with an exact middle apex.
 * 2. A complete dyadic phase grid is bounded, progresses monotonically and has the
 *    same lift in forward and reverse time.
 * 3. Adjacent phases near touchdown, liftoff and the apex never produce a negative
 *    clearance or an overshoot through cancellation at completion.
 * 4. Nonfinite phases refuse and mutating a result cannot change a later query.
 *    Existing ride tests verify actual feet, support and attachments.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States normalized phase, endpoint progress, nonnegative clearance, independent dyadic literals, binary64 boundary cases, invalid input and pure result ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual profile used by all quadruped rides and checks its raw shares before they become geometric goals. A descending subtraction that creates negative lift is caught without a tolerance or a patched ride.
 * @evidence contracts/development/testing.md#independent-expectations The rest-to-rest quintic has integrated coefficients 10,-15,6; literal values at eighths are exact binary64 fractions. Progress is in [0,1], lift is in [0,1], endpoint lift is zero, middle lift is one and time reversal leaves lift unchanged. Expectations never call the production minimumJerk helper.
 * @evidence contracts/development/testing.md#distinguishing-cases Literal anchors, 4097 exact dyadic phases, powers-of-two adjacent boundary distances, nonfinite input and returned-record mutation distinguish a mathematically correct but cancellation-prone expression from a bounded actual goal path.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous unit uses the actual package entry point for the authoring profile consumed by rideQuadruped, with no filesystem fixture, process, compiler, renderer, foreign-method replacement or wall-time assertion.
 */
export function test_archetype_animal_swing_profile(): void {
  const findings: string[] = [];
  for (const [u, along, rise] of [
    [0, 0, 0],
    [0.125, 0.01605224609375, 0.103515625],
    [0.25, 0.103515625, 0.5],
    [0.5, 0.5, 1],
    [0.75, 0.896484375, 0.5],
    [0.875, 0.98394775390625, 0.103515625],
    [1, 1, 0],
  ] as const) {
    const actual: ReturnType<typeof AutoMovieArchetypeQuadrupedMotion.swing> =
      AutoMovieArchetypeQuadrupedMotion.swing(u);
    if (actual.along !== along || actual.rise !== rise)
      findings.push(`${u}: the path missed its literal quintic anchor`);
  }

  let previous: number = 0;
  for (let index: number = 0; index <= 4096; index++) {
    const u: number = index / 4096;
    const actual: ReturnType<typeof AutoMovieArchetypeQuadrupedMotion.swing> =
      observe(u);
    const reverse: ReturnType<typeof AutoMovieArchetypeQuadrupedMotion.swing> =
      observe(1 - u);
    if (actual.along < previous || actual.rise !== reverse.rise)
      findings.push(`${u}: progress reversed or lift lost time symmetry`);
    previous = actual.along;
  }
  for (let exponent: number = 2; exponent <= 53; exponent++) {
    const gap: number = 2 ** -exponent;
    for (const u of [gap, 1 - gap, 0.5 - gap, 0.5 + gap]) observe(u);
  }
  for (const u of [NaN, Infinity, -Infinity]) {
    try {
      AutoMovieArchetypeQuadrupedMotion.swing(u);
      findings.push(`${u}: a nonfinite phase was accepted`);
    } catch (error) {
      if (!(error instanceof Error))
        findings.push(`${u}: a nonfinite phase lost its explicit refusal`);
    }
  }
  const mutated: ReturnType<typeof AutoMovieArchetypeQuadrupedMotion.swing> =
    AutoMovieArchetypeQuadrupedMotion.swing(0.25);
  mutated.along = -1;
  mutated.rise = -1;
  const repeat: ReturnType<typeof AutoMovieArchetypeQuadrupedMotion.swing> =
    AutoMovieArchetypeQuadrupedMotion.swing(0.25);
  if (repeat.along !== 0.103515625 || repeat.rise !== 0.5)
    findings.push("a result mutation changed the prepared path");
  TestValidator.equals("bounded actual foot-swing shares", findings, []);

  /** Domain bounds are semantic constraints and receive no numerical slack. */
  function observe(
    u: number,
  ): ReturnType<typeof AutoMovieArchetypeQuadrupedMotion.swing> {
    const actual: ReturnType<typeof AutoMovieArchetypeQuadrupedMotion.swing> =
      AutoMovieArchetypeQuadrupedMotion.swing(u);
    if (
      actual.along < 0 ||
      actual.along > 1 ||
      actual.rise < 0 ||
      actual.rise > 1
    )
      findings.push(`${u}: a physical goal share left [0,1]`);
    return actual;
  }
}
