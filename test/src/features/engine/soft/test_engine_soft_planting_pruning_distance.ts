import { AutoMovieEnginePlanting } from "@automovie/engine";
import type {
  IAutoMoviePruningEnvelope,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `plantingPruningDistance` is where a unit-axis segment starting inside a
 * pruning envelope leaves it: the nearest slab exit of a box, the far root `−b
 *
 * - √(b² − c)` of a sphere; null when no envelope prunes or the exit is not
 *   before the segment's end.
 *
 * Scenarios:
 *
 * 1. From (0.5, 0.2, 0.5) up +Y in [0,1]³ a 2 m segment exits at 0.8.
 * 2. From the centre of a unit sphere along +X a 2 m segment exits at 1.
 * 3. A 0.5 m segment ends inside: null. No envelope: null.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEnginePlanting.plantingPruningDistance with a unit-axis segment through a box or a sphere, a segment ending before the box exit and an unconstrained segment.
 * @evidence contracts/development/testing.md#independent-expectations The box ceiling is y=1, so a base at y=0.2 exits after 0.8 m. The unit sphere exits 1 m from its centre. The 0.5 m segment cannot reach the ceiling.
 * @evidence contracts/development/common.md#meaningful-documentation Box and sphere fixtures exercise separate exit calculations. The short segment and unconstrained envelope exercise the two null results.
 */
export function test_engine_soft_planting_pruning_distance(): void {
  const box: IAutoMoviePruningEnvelope = {
    kind: "box",
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 1, z: 1 },
  };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  TestValidator.predicate(
    "the box exit",
    nclose(
      AutoMovieEnginePlanting.plantingPruningDistance(box, { x: 0.5, y: 0.2, z: 0.5 }, up, 2) ?? -1,
      0.8,
      1e-15,
    ),
  );
  const sphere: IAutoMoviePruningEnvelope = {
    kind: "sphere",
    center: { x: 0, y: 0, z: 0 },
    radius: 1,
  };
  TestValidator.equals(
    "the sphere exit",
    AutoMovieEnginePlanting.plantingPruningDistance(
      sphere,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      2,
    ),
    1,
  );
  TestValidator.equals(
    "a segment ending inside",
    AutoMovieEnginePlanting.plantingPruningDistance(box, { x: 0.5, y: 0.2, z: 0.5 }, up, 0.5),
    null,
  );
  TestValidator.equals(
    "no envelope",
    AutoMovieEnginePlanting.plantingPruningDistance({ kind: "none" }, { x: 0, y: 0, z: 0 }, up, 2),
    null,
  );
}
