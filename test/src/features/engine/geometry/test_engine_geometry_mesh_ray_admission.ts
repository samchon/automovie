import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Compiled rays admit finite coordinates and safe original face ordinals.
 *
 * A unit triangle admits an inclusive one-metre hit, the unbounded maximum,
 * subnormal and maximum finite direction scales, and a copied mesh. A real
 * exclusion removes the face. Invalid directions, origins, bounds, ordinals,
 * source positions and unrepresentable intersection arithmetic throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names ordinary, inclusive and extremely scaled rays, snapshot and exclusion, and malformed inputs and hit arithmetic.
 * @evidence contracts/development/testing.md#behavioral-verification Calls nearest, nearestHit and blocked through the compiled Engine caster and supplies raw values at factory and query admission.
 * @evidence contracts/development/testing.md#independent-expectations The triangle lies at z = 0, one metre below the vertical origin. Equal X and Z direction magnitudes move from (0,0.25,0.25) to (0.25,0.25,0) over sqrt(2)/4 metres regardless of scale. Twice 1.2e308 is unrepresentable travel.
 */
export function test_engine_geometry_mesh_ray_admission(): void {
  const create = AutoMovieEngineGeometry.createMeshRayCaster;
  const mesh: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  const ray = create(mesh);
  const origin = [0.2, 0.2, 1] as const;
  const down = [0, 0, -1] as const;
  TestValidator.equals(
    "admitted finite and open travel bounds",
    [
      ray.nearest(origin, down, 1, 1),
      ray.nearestHit(origin, down, Infinity),
      ray.blocked(origin, down, 1),
    ],
    [1, { distance: 1, triangle: 0 }, true],
  );
  TestValidator.equals(
    "origin-face exclusion",
    ray.nearestHit(origin, down, 2, 0, { excludedTriangles: new Set([0]) }),
    null,
  );
  for (const scale of [Number.MIN_VALUE, Number.MAX_VALUE]) {
    const hit = ray.nearestHit([0, 0.25, 0.25], [scale, 0, -scale], Infinity);
    TestValidator.predicate(
      "unit travel under extreme finite direction scales",
      hit?.triangle === 0 && Math.abs(hit.distance - Math.SQRT2 / 4) <= 1e-15,
    );
  }
  const old: number[] = [...mesh.positions];
  mesh.positions.fill(45);
  TestValidator.equals("copied geometry", ray.nearest(origin, down, 2), 1);
  const far: number = 1.2e308;
  const invalid: [string, () => unknown, string][] = [
    ["NaN origin", () => ray.nearest([NaN, 0.2, 1], down, 2), "finite origin"],
    [
      "infinite direction",
      () => ray.blocked(origin, [0, 0, -Infinity], 2),
      "finite nonzero direction",
    ],
    [
      "zero direction",
      () => ray.nearest(origin, [0, 0, 0], 2),
      "finite nonzero direction",
    ],
    [
      "infinite minimum",
      () => ray.nearest(origin, down, Infinity, Infinity),
      "finite minimum",
    ],
    ["NaN maximum", () => ray.nearest(origin, down, NaN), "minimum <= maximum"],
    [
      "fractional exclusion",
      () =>
        ray.nearestHit(origin, down, 2, 0, {
          excludedTriangles: new Set([0.5]),
        }),
      "original triangles",
    ],
    [
      "NaN exclusion",
      () =>
        ray.nearestHit(origin, down, 2, 0, {
          excludedTriangles: new Set([NaN]),
        }),
      "original triangles",
    ],
    [
      "unused NaN coordinate",
      () => create({ ...mesh, positions: [...old, NaN, 0, 0] }),
      "finite mesh positions",
    ],
    [
      "unrepresentable travel",
      () =>
        create({
          ...mesh,
          positions: [0, 0, far, 1, 0, far, 0, 1, far],
        }).nearestHit([0.2, 0.2, -far], [0, 0, 1], Infinity),
      "finite for triangle 0",
    ],
  ];
  TestValidator.equals(
    "invalid ray, mesh and arithmetic cases",
    invalid
      .filter(([, attempt, message]) => !throwsError(attempt, message))
      .map(([name]) => name),
    [],
  );
}
