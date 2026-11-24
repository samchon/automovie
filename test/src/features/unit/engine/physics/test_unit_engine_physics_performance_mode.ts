import { resolvePhysicalPerformanceMode } from "@automovie/engine";
import type { IAutoMoviePerformanceMode } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `resolvePhysicalPerformanceMode` takes the body's mode over the scene's and
 * refuses an invalid exaggeration.
 *
 * Scenarios:
 *
 * 1. With no body override the scene mode is returned as a copy.
 * 2. A body override wins over the scene.
 * 3. An exaggerated mode with a zero impulse, a negative gravity or a blank reason
 *    is refused.
 */
export function test_unit_engine_physics_performance_mode(): void {
  const scene: IAutoMoviePerformanceMode = { kind: "simulated" };
  const resolved = resolvePhysicalPerformanceMode(scene);
  TestValidator.equals("scene", resolved, scene);
  TestValidator.predicate("copy", resolved !== scene);
  TestValidator.equals(
    "body wins",
    resolvePhysicalPerformanceMode(scene, { kind: "kinematic" }),
    { kind: "kinematic" },
  );
  const exaggerated = (
    impulse: number,
    gravity: number,
    reason: string,
  ): IAutoMoviePerformanceMode => ({
    kind: "exaggerated",
    impulse,
    compliance: 1,
    gravity,
    reason,
  });
  TestValidator.equals(
    "valid",
    resolvePhysicalPerformanceMode(exaggerated(2, 0, "comic")),
    exaggerated(2, 0, "comic"),
  );
  TestValidator.predicate(
    "impulse",
    throwsError(() =>
      resolvePhysicalPerformanceMode(exaggerated(0, 1, "comic")),
    ),
  );
  TestValidator.predicate(
    "gravity",
    throwsError(() =>
      resolvePhysicalPerformanceMode(exaggerated(1, -1, "comic")),
    ),
  );
  TestValidator.predicate(
    "reason",
    throwsError(() => resolvePhysicalPerformanceMode(exaggerated(1, 1, "  "))),
  );
}
