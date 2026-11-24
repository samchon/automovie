import { measureAutoMovieMeshClearance } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/**
 * Invalid geometry and unrepresentable arithmetic never become a clear result.
 * Scenarios:
 * 1. Incomplete/nonfinite buffers and invalid indices refuse beside the valid
 *    indexed plane, and the axis vocabulary is enforced at runtime.
 * 2. Finite coordinates whose area, cross-triangle clipping or signed depth
 *    arithmetic overflow refuse at the relevant operation.
 */
export function test_unit_engine_geometry_geometry_mesh_clearance_refusals(): void {
  const mesh: {
    positions: number[];
    indices: number[];
    normals: null;
    uvs: null;
    skin: null;
  } = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  TestValidator.predicate(
    "valid contact plane",
    nclose(
      measureAutoMovieMeshClearance(mesh, mesh, "z")[0].minimum,
      0,
      1e-12,
    ) &&
      Math.abs(measureAutoMovieMeshClearance(mesh, mesh, "z")[0].minimum) <
        1e-12,
  );
  for (const invalid of [
    { ...mesh, positions: [0, 0] },
    { ...mesh, indices: [0, 1] },
    { ...mesh, indices: [0, 1, 3] },
    { ...mesh, indices: [0, 1, -1] },
  ])
    TestValidator.predicate(
      "invalid triangle buffers",
      throwsError(
        (): { triangle: number; minimum: number }[] =>
          measureAutoMovieMeshClearance(invalid, mesh, "z"),
        "triangle buffers",
      ),
    );
  TestValidator.predicate(
    "invalid axis",
    throwsError(
      (): { triangle: number; minimum: number }[] =>
        measureAutoMovieMeshClearance(mesh, mesh, "w" as never),
      "depth axis",
    ),
  );
  const huge: {
    positions: number[];
    indices: number[];
    normals: null;
    uvs: null;
    skin: null;
  } = { ...mesh, positions: [0, 0, 0, 1e308, 0, 0, 0, 1e308, 0] };
  TestValidator.predicate(
    "projected area overflow",
    throwsError(
      (): { triangle: number; minimum: number }[] =>
        measureAutoMovieMeshClearance(huge, mesh, "z"),
      "projected area",
    ),
  );
  const high: {
    positions: number[];
    indices: number[];
    normals: null;
    uvs: null;
    skin: null;
  } = {
    ...mesh,
    positions: mesh.positions.map((v: number, i: number): number =>
      i % 3 === 2 ? 1e308 : v,
    ),
  };
  const low: {
    positions: number[];
    indices: number[];
    normals: null;
    uvs: null;
    skin: null;
  } = {
    ...mesh,
    positions: mesh.positions.map((v: number, i: number): number =>
      i % 3 === 2 ? -1e308 : v,
    ),
  };
  TestValidator.predicate(
    "depth difference overflow",
    throwsError(
      (): { triangle: number; minimum: number }[] =>
        measureAutoMovieMeshClearance(high, low, "z"),
      "arithmetic",
    ),
  );
  const left: {
    positions: number[];
    indices: number[];
    normals: null;
    uvs: null;
    skin: null;
  } = {
    ...mesh,
    positions: [-1e308, 0, 0, 0, 0, 0, -1e308, 1e-308, 0],
  };
  const right: {
    positions: number[];
    indices: number[];
    normals: null;
    uvs: null;
    skin: null;
  } = {
    ...mesh,
    positions: [0, 0, 0, 1e308, 0, 0, 1e308, 1e-308, 0],
  };
  TestValidator.predicate(
    "cross triangle clipping overflow",
    throwsError(
      (): { triangle: number; minimum: number }[] =>
        measureAutoMovieMeshClearance(left, right, "z"),
      "clipping",
    ),
  );
}
