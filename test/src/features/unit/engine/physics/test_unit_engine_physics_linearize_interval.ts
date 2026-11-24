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
}
