import { TestValidator } from "@nestia/e2e";

import { rayTriangleTravelOracle } from "../internal/rayTriangleTravelOracle";

/**
 * The exhaustive oracle admits an independently authored unit triangle at z=1.
 * Its scalar boundary branches are exercised directly rather than assumed from
 * the larger seeded field. Expected travel follows the plane and unit direction.
 *
 * Scenarios:
 * 1. Parallel, either u boundary, negative v and u+v above one miss the triangle.
 * 2. Travel behind the origin or past maximum is absent, while exact zero and
 *    exact maximum retain the closed interval beside an ordinary interior hit.
 */
export const test_geometry_ray_triangle_oracle = (): void => {
  const triangle = { a: [0, 0, 1], ab: [1, 0, 0], ac: [0, 1, 0] };
  for (const origin of [[-1, .2, 0], [2, .2, 0], [.2, -1, 0], [.8, .8, 0]])
    TestValidator.equals("outside triangle barycentric admission", rayTriangleTravelOracle(origin, [0, 0, 1], triangle, 20), null);
  TestValidator.equals("parallel ray", rayTriangleTravelOracle([.2, .2, 0], [1, 0, 0], triangle, 20), null);
  TestValidator.equals("travel behind origin", rayTriangleTravelOracle([.2, .2, 2], [0, 0, 1], triangle, 20), null);
  TestValidator.equals("travel beyond maximum", rayTriangleTravelOracle([.2, .2, -20], [0, 0, 1], triangle, 20), null);
  TestValidator.equals("ordinary interior hit", rayTriangleTravelOracle([.2, .2, 0], [0, 0, 1], triangle, 20), 1);
  TestValidator.equals("exact maximum belongs to interval", rayTriangleTravelOracle([.2, .2, -19], [0, 0, 1], triangle, 20), 20);
  TestValidator.predicate("zero travel belongs to interval", rayTriangleTravelOracle([.2, .2, 1], [0, 0, 1], triangle, 20) === 0);
};
