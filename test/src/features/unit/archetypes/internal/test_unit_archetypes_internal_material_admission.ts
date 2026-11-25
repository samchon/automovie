import { AutoMovieArchetypeMaterial as material } from "@automovie/archetypes";
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
 */
export function test_unit_archetypes_internal_material_admission(): void {
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
