import { physicalHullSegment, AutoMovieEnginePhysics } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `physicalHullMass` and `physicalHullSegment` read the unit cube [0, 1]^3
 * given by its eight corners.
 *
 * Scenarios:
 *
 * 1. Volume 1, centroid (1/2, 1/2, 1/2) and principal moments 1/6 each (a cube of
 *    side a has I / m = a^2 / 6).
 * 2. The segment from (-1, 1/2, 1/2) to (2, 1/2, 1/2) is deepest at its middle,
 *    parameter 1/2.
 * 3. Four coplanar points span no volume and are refused.
 */
export function test_engine_physics_hull_cube(): void {
  const corners: IAutoMovieVector3[] = [];
  for (const x of [0, 1])
    for (const y of [0, 1]) for (const z of [0, 1]) corners.push({ x, y, z });
  const mass = AutoMovieEnginePhysics.hullMass(corners);
  TestValidator.predicate("volume", nclose(mass.volume, 1, 1e-12));
  TestValidator.predicate(
    "centre",
    nclose(mass.centerOfMass.x, 0.5, 1e-12) &&
      nclose(mass.centerOfMass.y, 0.5, 1e-12) &&
      nclose(mass.centerOfMass.z, 0.5, 1e-12),
  );
  TestValidator.predicate(
    "inertia",
    nclose(mass.inertia.x, 1 / 6, 1e-12) &&
      nclose(mass.inertia.y, 1 / 6, 1e-12) &&
      nclose(mass.inertia.z, 1 / 6, 1e-12),
  );
  TestValidator.predicate(
    "deepest",
    nclose(
      physicalHullSegment(
        corners,
        { x: -1, y: 0.5, z: 0.5 },
        { x: 2, y: 0.5, z: 0.5 },
      ),
      0.5,
      1e-9,
    ),
  );
  const flat: IAutoMovieVector3[] = [0, 1].flatMap(
    (x: number): IAutoMovieVector3[] =>
      [0, 1].map((y: number): IAutoMovieVector3 => ({ x, y, z: 0 })),
  );
  TestValidator.predicate(
    "flat",
    throwsError(() => AutoMovieEnginePhysics.hullMass(flat)),
  );
}
