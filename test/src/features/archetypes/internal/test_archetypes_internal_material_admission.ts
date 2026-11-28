import {
  AutoMovieArchetypeDrinkware,
  AutoMovieArchetypeMaterial as material,
  AutoMovieArchetypeRefusal,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * Contact coefficients are admitted from explicit values or a measured pair.
 *
 * Scenarios:
 *
 * 1. A declared material survives admission. An absent material refuses.
 * 2. Restitution stays unknown without an explicit value. Both interval limits and
 *    an interior value are valid. A value outside either end refuses.
 * 3. Friction resolves a measured pair in either operand order and refuses a pair
 *    with no measurement.
 * 4. A serialized string does not become a restitution or fill ratio.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names material and friction admission, unknown and authored restitution, and the raw input representation check.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public coefficient selectors and makes a real drinkware request with a raw field in place of its typed fill.
 * @evidence contracts/development/testing.md#independent-expectations Zero and one bound a finite numerical ratio. A value encoded as a string remains a separate representation. A measured friction pair identifies the same row in each operand order.
 */
export function test_archetypes_internal_material_admission(): void {
  TestValidator.equals(
    "declared material",
    material.admit("rubber", "test"),
    "rubber",
  );
  TestValidator.error("a missing material", (): unknown =>
    material.admit(undefined, "test"),
  );
  TestValidator.equals(
    "material does not supply restitution by itself",
    material.restitution("rubber", undefined, "test"),
    null,
  );
  for (const value of [0, 1 / 2, 1])
    TestValidator.equals(
      "authored coefficient",
      material.restitution("rubber", value, "test"),
      value,
    );
  TestValidator.error("negative coefficient", (): unknown =>
    material.restitution("rubber", -1 / 2, "test"),
  );
  TestValidator.error("coefficient beyond one", (): unknown =>
    material.restitution("rubber", 3 / 2, "test"),
  );
  const rawRatio: number = JSON.parse('"0.4"');
  const invalidRatios: readonly [string, () => unknown][] = [
    ["restitution", () => material.restitution("rubber", rawRatio, "test")],
    ["fill", () => AutoMovieArchetypeDrinkware.create({ kind: "cup", fill: rawRatio })],
  ];
  const failures: string[] = [];
  for (const [axis, call] of invalidRatios) {
    try {
      call();
      failures.push(`${axis} accepted a serialized string`);
    } catch (error) {
      if (!(error instanceof AutoMovieArchetypeRefusal) || error.axis !== axis)
        failures.push(`${axis} did not give a structured parameter refusal`);
    }
  }
  TestValidator.equals("invalid ratio admissions", failures, []);

  const original: material.IFriction = material.friction(
    "concrete",
    "rubber",
    "test",
  );
  const reversed: material.IFriction = material.friction(
    "rubber",
    "concrete",
    "test",
  );
  TestValidator.predicate(
    "operand order names the same measured row",
    original === reversed,
  );
  TestValidator.error("unmeasured friction pair", (): unknown =>
    material.friction("paper", "stone", "test"),
  );
}
