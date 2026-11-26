import { Quaternion, AutoMovieEngineFilm } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, vclose } from "../../internal/predicates";

/**
 * `foldRoot` places a sampled pose root under its node's staged placement the
 * way the viewer draws it: the root travels in node space, turns with the
 * staging, and its scale is dropped.
 *
 * Staging: translation (3, 0, -2), a 90 degree yaw about +Y, unit scale.
 *
 * Scenarios:
 *
 * 1. A null root returns the staged placement itself.
 * 2. A root 1 m along node +X with its own 90 degree yaw lands at (3, 0, -3), 1 m
 *    along world -Z, and its yaw adds to 180 degrees.
 * 3. A root scale of 2 leaves the staged unit scale and the same position.
 */
export function test_engine_film_fold_root(): void {
  const base: IAutoMovieTransform = {
    translation: { x: 3, y: 0, z: -2 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    scale: { x: 1, y: 1, z: 1 },
  };
  TestValidator.predicate("null root", AutoMovieEngineFilm.foldRoot(base, null) === base);
  const root: IAutoMovieTransform = {
    translation: { x: 1, y: 0, z: 0 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    scale: { x: 1, y: 1, z: 1 },
  };
  const folded: IAutoMovieTransform = AutoMovieEngineFilm.foldRoot(base, root);
  TestValidator.predicate(
    "travels in node space",
    vclose(folded.translation, { x: 3, y: 0, z: -3 }, 1e-9),
  );
  TestValidator.predicate(
    "yaw composes",
    qclose(
      folded.rotation,
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      1e-9,
    ),
  );
  const scaled: IAutoMovieTransform = AutoMovieEngineFilm.foldRoot(base, {
    ...root,
    scale: { x: 2, y: 2, z: 2 },
  });
  TestValidator.predicate(
    "scale dropped",
    vclose(scaled.scale, base.scale, 1e-9),
  );
  TestValidator.predicate(
    "scale does not move",
    vclose(scaled.translation, folded.translation, 1e-9),
  );
}
