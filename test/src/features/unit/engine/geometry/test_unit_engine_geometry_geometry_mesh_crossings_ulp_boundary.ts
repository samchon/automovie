import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

const surface: IAutoMovieMesh = {
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
  indices: [0, 1, 2],
  normals: null,
  uvs: null,
  skin: null,
};
/** A vertical blade whose near endpoint and face edge can be varied alone. */
const blade: (y: number, lowZ: number) => IAutoMovieMesh = (
  y: number,
  lowZ: number,
): IAutoMovieMesh => ({
  positions: [0.25, y, lowZ, 0.25, y, 1, 0.75, y, 1],
  indices: [0, 1, 2],
  normals: null,
  uvs: null,
  skin: null,
});

/**
 * A deliberately authored 1e-13 displacement at an edge or endpoint is contact
 * under the selected dimensionless interior tolerance; it is not a measured ULP.
 * a point a micrometre inside either bound is a true crossing. Both witness
 * modes must agree on that geometric boundary.
 *
 * Scenarios:
 * 1. The retained 1e-13 endpoint/edge perturbations are filtered in both modes.
 * 2. The adjacent 1e-6 perturbations produce a transverse witness in both modes.
 * 3. Zero/default tolerance behavior and invalid tolerance refusals are retained.
 */
export function test_unit_engine_geometry_geometry_mesh_crossings_ulp_boundary(): void {
  for (const allPairs of [false, true]) {
    TestValidator.equals(
      `segment endpoint roundoff is contact (${allPairs})`,
      measureAutoMovieMeshCrossings(surface, blade(0.25, -1e-13), {
        allPairs,
        interiorTolerance: 1e-9,
      }),
      [],
    );
    TestValidator.equals(
      `triangle edge roundoff is contact (${allPairs})`,
      measureAutoMovieMeshCrossings(surface, blade(1e-13, -1), {
        allPairs,
        interiorTolerance: 1e-9,
      }),
      [],
    );
    TestValidator.equals(
      `a deeper segment crossing is retained (${allPairs})`,
      measureAutoMovieMeshCrossings(surface, blade(0.25, -1e-6), {
        allPairs,
        interiorTolerance: 1e-9,
      }),
      [{ triangle: 0, other: 0, coplanar: false }],
    );
    TestValidator.equals(
      `a point inside the triangle edge is retained (${allPairs})`,
      measureAutoMovieMeshCrossings(surface, blade(1e-6, -1), {
        allPairs,
        interiorTolerance: 1e-9,
      }),
      [{ triangle: 0, other: 0, coplanar: false }],
    );
  }
  TestValidator.equals(
    "zero tolerance retains the default topology predicate",
    measureAutoMovieMeshCrossings(surface, blade(0.25, -1e-13), {
      interiorTolerance: 0,
    }),
    measureAutoMovieMeshCrossings(surface, blade(0.25, -1e-13)),
  );
  for (const tolerance of [-1, 0.5,])
    TestValidator.predicate(
      `invalid tolerance ${tolerance} refuses`,
      throwsError(
        (): ReturnType<typeof measureAutoMovieMeshCrossings> =>
          measureAutoMovieMeshCrossings(surface, blade(0.25, -1), {
            interiorTolerance: tolerance,
          }),
        "Mesh crossing interior tolerance needs a finite [0, 0.5) value.",
      ),
    );
}
