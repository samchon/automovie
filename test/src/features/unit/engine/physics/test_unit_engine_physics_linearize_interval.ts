import { linearizePhysicalInterval } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `linearizePhysicalInterval` freezes only strictly violated inequality rows
 * for a probe value.
 *
 * Scenarios:
 *
 * 1. A value above the maximum 3 (value 5, minimum 0) gives rows [0, probe - 3].
 * 2. A value below the minimum 0 (value -1, maximum 3) gives rows [probe - 0, 0].
 * 3. A value inside gives only zero rows.
 * 4. Equal bounds (2, 2) at value 2 give one signed row [probe - 2, 0].
 * 5. An absent bound gives no row.
 * 6. Equality probes across a crossing: for value -1e-6 and 1e-6 with bounds (0,
 *    0), the two rows sum to a full unit derivative over a step of 1e-4. Slack
 *    and exact boundaries (values 0, 0.5, 1 in [0, 1]) give zero rows either
 *    side. A violated lower side (-1e-6, minimum 0) gives [1e-4] for a probe of
 *    1e-4; a violated upper side (1e-6, maximum 0) gives [-1e-4] for a probe of
 *    -1e-4; a narrow interval (-1e-4, [0, 1e-6]) gives [1e-4, 0].
 */
export function test_unit_engine_physics_linearize_interval(): void {
  TestValidator.equals("above", linearizePhysicalInterval(5, 0, 3)(4), [0, 1]);
  TestValidator.equals(
    "below",
    linearizePhysicalInterval(-1, 0, 3)(0.5),
    [0.5, 0],
  );
  TestValidator.equals("inside", linearizePhysicalInterval(1, 0, 3)(9), [0, 0]);
  TestValidator.equals(
    "equality",
    linearizePhysicalInterval(2, 2, 2)(7),
    [5, 0],
  );
  TestValidator.equals(
    "only maximum",
    linearizePhysicalInterval(5, undefined, 3)(4),
    [1],
  );
  TestValidator.equals(
    "only minimum",
    linearizePhysicalInterval(-1, 0, undefined)(0.5),
    [0.5],
  );
  const delta: number = 1e-4;
  for (const value of [-1e-6, 1e-6]) {
    const model: (probe: number) => number[] = linearizePhysicalInterval(
      value,
      0,
      0,
    );
    const before: number[] = model(value);
    const after: number[] = model(value + delta);
    const derivative: number[] = after.map(
      (entry: number, index: number): number =>
        (entry - before[index]!) / delta,
    );
    TestValidator.predicate(
      "equality derivative",
      Math.abs(derivative[0]! + derivative[1]! - 1) < 1e-12,
    );
  }
  for (const value of [0, 0.5, 1]) {
    const model: (probe: number) => number[] = linearizePhysicalInterval(
      value,
      0,
      1,
    );
    TestValidator.equals("slack before", model(value - delta), [0, 0]);
    TestValidator.equals("slack after", model(value + delta), [0, 0]);
  }
  TestValidator.equals(
    "violated lower",
    linearizePhysicalInterval(-1e-6, 0)(delta),
    [delta],
  );
  TestValidator.equals(
    "violated upper",
    linearizePhysicalInterval(1e-6, undefined, 0)(-delta),
    [-delta],
  );
  TestValidator.equals(
    "narrow",
    linearizePhysicalInterval(-delta, 0, 1e-6)(delta),
    [delta, 0],
  );
}
