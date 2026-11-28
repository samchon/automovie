import {
  AutoMovieArchetypeArmour,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * Refuses unusable fit measurements at their field before constructing armour.
 *
 * Scenarios:
 *
 * 1. A helmet reports NaN, infinity, and zero as `measure.headRadius`.
 * 2. A vambrace reports infinite length as `measure.forearm`.
 * 3. Valid head radius accepts an unused infinite shank measurement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names invalid fit values, the refusal axes, and the unused-field control.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the published armour factory and checks its structured refusal or fitted wear socket directly.
 * @evidence contracts/development/testing.md#independent-expectations A used length must be finite and positive. The helmet has no need for shank radius and retains its wear socket.
 */
export function test_archetype_armour_measure_admission(): void {
  const invalid: readonly [AutoMovieArchetypeArmour.IParams, string][] = [
    ...[0, NaN, Infinity].map(
      (headRadius: number): [AutoMovieArchetypeArmour.IParams, string] => [
        { kind: "openHelmet", measure: { headRadius } },
        "measure.headRadius",
      ],
    ),
    [
      { kind: "vambrace", measure: { forearmRadius: 0.05, forearm: Infinity } },
      "measure.forearm",
    ],
  ];
  const failures: string[] = [];
  for (const [params, axis] of invalid) {
    try {
      AutoMovieArchetypeArmour.create(params);
      failures.push(`${axis} accepted a nonpositive or nonfinite measurement`);
    } catch (error) {
      if (!(error instanceof AutoMovieArchetypeRefusal) || error.axis !== axis)
        failures.push(
          `${axis} reported ${error instanceof AutoMovieArchetypeRefusal ? error.axis : String(error)}`,
        );
    }
  }
  const helmet: AutoMovieArchetypeArmour.IAssemblyModel =
    AutoMovieArchetypeArmour.create({
      kind: "openHelmet",
      measure: { headRadius: 0.1, shankRadius: Infinity },
    });
  TestValidator.equals("fit admission failures", failures, []);
  TestValidator.equals("wear socket", helmet.affordance("wear").kind, "socket");
}
