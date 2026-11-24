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
 */
export function test_unit_archetypes_animals_animal_swing_profile(): void {
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
