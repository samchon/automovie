import { AutoMovieEnginePhysicalSimulation } from "@automovie/engine";
import type { IAutoMoviePerformanceMode } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines body override precedence, a copied scene fallback and validation of exaggerated modes.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves typed scene and body policies and submits zero impulse, negative gravity and a blank exaggeration reason.
 * @evidence contracts/development/testing.md#independent-expectations The actual body policy wins whenever supplied. A scene fallback has equal fields with distinct identity, while all three malformed policies must fail.
 */
export function test_engine_physics_performance_mode(): void {
  const scene: IAutoMoviePerformanceMode = { kind: "simulated" };
  const resolved = AutoMovieEnginePhysicalSimulation.resolvePerformanceMode(scene);
  TestValidator.equals("scene", resolved, scene);
  TestValidator.predicate("copy", resolved !== scene);
  TestValidator.equals(
    "body wins",
    AutoMovieEnginePhysicalSimulation.resolvePerformanceMode(scene, { kind: "kinematic" }),
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
    AutoMovieEnginePhysicalSimulation.resolvePerformanceMode(exaggerated(2, 0, "comic")),
    exaggerated(2, 0, "comic"),
  );
  TestValidator.predicate(
    "impulse",
    throwsError(() =>
      AutoMovieEnginePhysicalSimulation.resolvePerformanceMode(exaggerated(0, 1, "comic")),
    ),
  );
  TestValidator.predicate(
    "gravity",
    throwsError(() =>
      AutoMovieEnginePhysicalSimulation.resolvePerformanceMode(exaggerated(1, -1, "comic")),
    ),
  );
  TestValidator.predicate(
    "reason",
    throwsError(() => AutoMovieEnginePhysicalSimulation.resolvePerformanceMode(exaggerated(1, 1, "  "))),
  );
}
