import type { IAutoMovieVector3 } from "@automovie/interface";
import { jumpPath } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one product and sum per component, metres. */
const ROUNDING: number = 1e-12;

/**
 * `jumpPath.lerp` interpolates two points straight, `a + (b - a) s`, the share
 * unclamped.
 *
 * Scenarios:
 *
 * 1. The share 0 gives `a` and 1 gives `b`.
 * 2. A quarter of the way from (0, 0, 0) to (4, -8, 2) is (1, -2, 0.5).
 * 3. A share past 1 extrapolates: 1.5 gives (6, -12, 3).
 */
export function test_unit_motions_actions_jump_path_lerp(): void {
  const a: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const b: IAutoMovieVector3 = { x: 4, y: -8, z: 2 };
  TestValidator.predicate("at a", vclose(jumpPath.lerp(a, b, 0), a, ROUNDING));
  TestValidator.predicate("at b", vclose(jumpPath.lerp(a, b, 1), b, ROUNDING));
  TestValidator.predicate(
    "a quarter of the way",
    vclose(jumpPath.lerp(a, b, 0.25), { x: 1, y: -2, z: 0.5 }, ROUNDING),
  );
  TestValidator.predicate(
    "past b",
    vclose(jumpPath.lerp(a, b, 1.5), { x: 6, y: -12, z: 3 }, ROUNDING),
  );
}
