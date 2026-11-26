import { AutoMovieEnginePlanting } from "@automovie/engine";
import type { IAutoMoviePruningEnvelope } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `plantingContainsPoint` tests a point against a pruning envelope: none
 * contains everything, a box and a sphere are closed sets.
 *
 * Scenarios:
 *
 * 1. No envelope contains (100, 100, 100).
 * 2. The box [0,1]³ contains its corner (1, 1, 1) but not (1.5, 0.5, 0.5).
 * 3. The sphere of radius 1 about the origin contains (0.6, 0.8, 0), on its
 *    surface, but not (1, 1, 0).
 */
export function test_engine_soft_planting_contains_point(): void {
  TestValidator.predicate(
    "no envelope",
    AutoMovieEnginePlanting.plantingContainsPoint({ kind: "none" }, { x: 100, y: 100, z: 100 }),
  );
  const box: IAutoMoviePruningEnvelope = {
    kind: "box",
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 1, z: 1 },
  };
  TestValidator.predicate(
    "the closed box",
    AutoMovieEnginePlanting.plantingContainsPoint(box, { x: 1, y: 1, z: 1 }) &&
      !AutoMovieEnginePlanting.plantingContainsPoint(box, { x: 1.5, y: 0.5, z: 0.5 }),
  );
  const sphere: IAutoMoviePruningEnvelope = {
    kind: "sphere",
    center: { x: 0, y: 0, z: 0 },
    radius: 1,
  };
  TestValidator.predicate(
    "the closed sphere",
    AutoMovieEnginePlanting.plantingContainsPoint(sphere, { x: 0.6, y: 0.8, z: 0 }) &&
      !AutoMovieEnginePlanting.plantingContainsPoint(sphere, { x: 1, y: 1, z: 0 }),
  );
}
