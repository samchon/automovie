import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { throwsError } from "../internal/throwsError";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Runs crossing with both witness modes and explicit interior tolerance, asserting empty reports for shallow perturbations, retained ordinals for deeper piercings, zero/default behavior and invalid-tolerance exceptions. It distinguishes deliberate boundary policy from unconditionally discarding small intersections.
 * @evidence contracts/testing.md#independent-expectations The existing unit triangle and vertical blade give dimensionless edge/segment parameters with 1e-13 perturbations below 1e-9 and 1e-6 perturbations above it. Default-versus-explicit compatibility shares the implementation and is not an independent numerical oracle; neither displacement is claimed to be a measured arithmetic residue or universal physical tolerance.
 * @evidence contracts/testing.md#distinguishing-cases Preserves endpoint versus face edge, shallow versus deeper displacement, false/true witness modes, zero/default option and each malformed tolerance. General coplanarity, shared-corner folds and complete multi-pair enumeration belong to the other crossing tests.
 * @evidence contracts/testing.md#execution-ownership The named geometry entry directly executes portable source with unchanged synthetic triangles and existing exception assertions. It starts no host process, browser, GPU or native build and registers no additional cases or Human probes.
 */
export function test_geometry_mesh_crossings_ulp_boundary(): void {
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
  for (const tolerance of [-1, 0.5, Number.NaN])
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
