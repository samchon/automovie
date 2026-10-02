import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { faceSupportFaultTriangles } from "../../../scripts/face-review/faceSupportFaultTriangles";
import { faceSupportFaults } from "../../../scripts/face-review/faceSupportFaults";

/**
 * Coplanar overlap remains outside the face support's transverse fault census.
 * A small triangle at Z=1 projects strictly inside the unit XY host. Moving
 * it to Z=0 makes their areas overlap without changing either normal. The
 * engine must first report the actual coplanar pair; the face APIs deliberately
 * exclude that pair and therefore do not certify this resulting surface.
 *
 * Scenarios:
 * 1. Confirm coplanar area overlap independently through the raw engine query.
 * 2. Count and triangle reports retain their documented coplanar exclusion.
 */
export const test_subject_face_support_fault_coplanar = (): void => {
  const source = [
    0, 0, 0, 1, 0, 0, 0, 1, 0,
    0.1, 0.1, 1, 0.2, 0.1, 1, 0.1, 0.2, 1,
  ];
  const positions = [...source];
  for (const vertex of [3, 4, 5]) positions[3 * vertex + 2] = 0;
  const indices = [0, 1, 2, 3, 4, 5];
  const mesh = {
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  };
  TestValidator.predicate(
    "the fixture has a coplanar area overlap",
    measureAutoMovieMeshCrossings(mesh, mesh, {
      allPairs: true,
      interiorTolerance: 1e-9,
    }).some((pair) => pair.triangle !== pair.other && pair.coplanar),
  );
  const input = { source, positions, indices, triangles: [3] };
  TestValidator.equals("coplanar overlap is outside the census", faceSupportFaults(input), 0);
  TestValidator.equals("excluded faces are not reported", [...faceSupportFaultTriangles(input)], []);
};
