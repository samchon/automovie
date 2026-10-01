import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { faceSupportFaultTriangles } from "../../../scripts/face-review/faceSupportFaultTriangles";
import { faceSupportFaults } from "../../../scripts/face-review/faceSupportFaults";

/**
 * A shared vertex must not hide a transverse fold between otherwise adjacent faces.
 * The host is the unit XY triangle. The blade shares its origin and starts above
 * it, through (0.25,0.25,1) and (0.75,0.25,4). Lowering its second vertex to Z=-1
 * intersects the host along the segment from the origin to (0.35,0.25,0), with
 * positive length in both interiors. Its normal retains a positive dot with
 * the source normal, so this is a crossing fault without an orientation fault.
 *
 * Scenarios:
 * 1. Confirm the fixture's transverse crossing through the engine, then require
 *    one newly crossing pair and both triangle offsets from the face checker.
 * 2. The source's boundary-only shared-vertex touch creates no fault.
 */
export const test_subject_face_support_fault_shared_vertex = (): void => {
  const source = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0.25, 0.25, 1, 0.75, 0.25, 4];
  const positions = [...source];
  positions[11] = -1;
  const indices = [0, 1, 2, 0, 3, 4];
  const mesh = {
    positions,
    indices,
    normals: null,
    uvs: null,
    skin: null,
  };
  TestValidator.predicate(
    "fixture crosses through shared-vertex faces",
    measureAutoMovieMeshCrossings(mesh, mesh, {
      allPairs: true,
      interiorTolerance: 1e-9,
    }).some((pair) => pair.triangle !== pair.other && !pair.coplanar),
  );
  const input = { source, positions, indices, triangles: [0, 3] };
  TestValidator.equals("the new fold is charged", faceSupportFaults(input), 1);
  TestValidator.equals(
    "both folded faces are reported",
    [...faceSupportFaultTriangles(input)].sort((a, b) => a - b),
    [0, 3],
  );
  TestValidator.equals(
    "shared-vertex touch remains clear",
    faceSupportFaults({ ...input, positions: source }),
    0,
  );
};
