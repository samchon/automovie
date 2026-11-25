import { plantingPruningDistance } from "@automovie/engine";
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
      plantingPruningDistance(box, { x: 0.5, y: 0.2, z: 0.5 }, up, 2) ?? -1,
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
    plantingPruningDistance(
      sphere,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      2,
    ),
    1,
  );
  TestValidator.equals(
    "a segment ending inside",
    plantingPruningDistance(box, { x: 0.5, y: 0.2, z: 0.5 }, up, 0.5),
    null,
  );
  TestValidator.equals(
    "no envelope",
    plantingPruningDistance({ kind: "none" }, { x: 0, y: 0, z: 0 }, up, 2),
    null,
  );
}
