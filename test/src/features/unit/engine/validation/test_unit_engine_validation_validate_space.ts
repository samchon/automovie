import { validateSpace } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { hasViolation } from "../../../internal/predicates";
import { validationSpaceFixtures } from "../../../internal/validationSpaceFixtures";

/**
 * `validateSpace` admits a walkable space before ground queries read it.
 *
 * Fixture: the flat floor plus ramp space (`validationSpaceFixtures`), one
 * surface replaced at a time.
 *
 * Scenarios:
 *
 * 1. The space passes; so do an L-shaped (concave) footprint and a square with an
 *    extra point on one edge.
 * 2. A second surface with the id `floor` is a type finding at `surfaces[1].id`; a
 *    two-point footprint and three collinear points are type findings at
 *    `.polygon`.
 */
export function test_unit_engine_validation_validate_space(): void {
  const { v, valid, withSurface }: ReturnType<typeof validationSpaceFixtures> =
    validationSpaceFixtures();

  // 1.
  TestValidator.equals("valid", validateSpace({ space: valid }).success, true);
  TestValidator.equals(
    "concave",
    validateSpace({
      space: withSurface({
        polygon: [v(0, 0), v(4, 0), v(4, 2), v(2, 2), v(2, 4), v(0, 4)],
      }),
    }).success,
    true,
  );
  TestValidator.equals(
    "edge point",
    validateSpace({
      space: withSurface({
        polygon: [v(0, 0), v(2, 0), v(4, 0), v(4, 4), v(0, 4)],
      }),
    }).success,
    true,
  );

  // 2.
  TestValidator.predicate(
    "duplicate id",
    hasViolation(
      validateSpace({ space: withSurface({ id: "floor" }) }),
      "type",
      "surfaces[1].id",
    ),
  );
  for (const [label, polygon] of [
    ["two points", [v(0, 0), v(1, 0)]],
    ["collinear", [v(0, 0), v(1, 1), v(2, 2)]],
  ] satisfies [string, ReturnType<typeof v>[]][])
    TestValidator.predicate(
      label,
      hasViolation(
        validateSpace({ space: withSurface({ polygon }) }),
        "type",
        ".polygon",
      ),
    );
}
