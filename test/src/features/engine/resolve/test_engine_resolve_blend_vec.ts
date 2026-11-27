import { AutoMovieEngineResolve } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

/**
 * `blendVec` is the linear interpolation `a + (b − a) t`.
 *
 * Scenarios:
 *
 * 1. (0, 0, 0) to (2, 4, −6) at ¼ is (0.5, 1, −1.5); t = 0 and 1 are the ends.
 */
export function test_engine_resolve_blend_vec(): void {
  const a: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const b: IAutoMovieVector3 = { x: 2, y: 4, z: -6 };
  TestValidator.predicate(
    "a quarter",
    vclose(AutoMovieEngineResolve.blendVec(a, b, 0.25), { x: 0.5, y: 1, z: -1.5 }),
  );
  TestValidator.predicate(
    "the ends",
    vclose(AutoMovieEngineResolve.blendVec(a, b, 0), a) && vclose(AutoMovieEngineResolve.blendVec(a, b, 1), b),
  );
}
