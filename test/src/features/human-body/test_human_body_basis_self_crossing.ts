import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { assertHumanBodyBasis } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * A connected, topologically closed skin can still intersect itself in 3D.
 *
 * Scenarios:
 * 1. The analytic box has no self crossing and is an admitted neutral skin.
 * 2. Move its first vertex 1 m across the opposite faces. The same triangles
 *    retain their manifold indices and finite coordinates, while the
 *    independent crossing instrument finds nonadjacent triangle crossings;
 *    basis admission must refuse that surface before any body can build.
 */
export const test_human_body_basis_self_crossing = (): void => {
  const { basis } = humanBodyBasisFixture();
  const surface = basis.surfaces[0];
  const crossings = (): number =>
    measureAutoMovieMeshCrossings(
      {
        positions: surface.positions,
        indices: surface.indices,
        normals: null,
        uvs: null,
        skin: null,
      },
      {
        positions: surface.positions,
        indices: surface.indices,
        normals: null,
        uvs: null,
        skin: null,
      },
    ).length;
  TestValidator.equals("an ordinary box has no self crossing", crossings(), 0);
  assertHumanBodyBasis(basis);
  surface.positions[0] += 1;
  TestValidator.predicate(
    "a manifold box can have a geometric self crossing",
    crossings() > 0,
  );
  TestValidator.predicate(
    "a self-crossing neutral body basis refuses admission",
    throwsError(() => assertHumanBodyBasis(basis), "cross itself"),
  );
};
