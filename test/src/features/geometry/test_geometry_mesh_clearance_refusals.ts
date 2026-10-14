import { nclose } from "../internal/nclose";
import { measureAutoMovieMeshClearance } from "../../../../packages/engine/src/geometry/measureAutoMovieMeshClearance";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "../internal/throwsError";

/**
 * Invalid geometry and unrepresentable arithmetic never become a clear result.
 * Scenarios:
 * 1. Incomplete/nonfinite buffers and invalid indices refuse beside the valid
 *    indexed plane, and the axis vocabulary is enforced at runtime.
 * 2. Finite coordinates whose area, cross-triangle clipping or signed depth
 *    arithmetic overflow refuse at the relevant operation.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes actual projected clearance admission and arithmetic, asserting valid zero contact beside named refusals for malformed triangle buffers, axis vocabulary and overflowing area, clipping or signed-depth operations. A refusal cannot silently become an empty clear report.
 * @evidence contracts/testing.md#independent-expectations The identical unit plane has zero gap; component counts, finite coordinates and valid triangle ordinals are input contracts. The authored extreme finite coordinates overflow the named arithmetic stages, so the expected outcome is refusal rather than any transcribed output value. Exception substrings identify the boundary, not exact message formatting.
 * @evidence contracts/testing.md#distinguishing-cases Keeps incomplete and NaN positions, incomplete/fractional/negative/out-of-range indices, unknown axis, and separate area, clipping and signed-depth overflow fixtures. Ordinary affine extrema and population pruning remain in mesh-clearance and spatial tests.
 * @evidence contracts/testing.md#execution-ownership The named geometry entry calls portable source and the existing exception observer directly on unchanged data. It starts no real host, GPU, browser, process or native build and registers no additional cases; numeric refusals do not prove visible geometry.
 */
export function test_geometry_mesh_clearance_refusals(): void {
  const mesh: { positions: number[]; indices: number[]; normals: null; uvs: null; skin: null; } = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    indices: [0, 1, 2],
    normals: null,
    uvs: null,
    skin: null,
  };
  TestValidator.predicate(
    "valid contact plane",
    (nclose(measureAutoMovieMeshClearance(mesh, mesh, "z")[0].minimum, 0, 1e-12) && Math.abs(measureAutoMovieMeshClearance(mesh, mesh, "z")[0].minimum) < 1e-12),
  );
  for (const invalid of [
    { ...mesh, positions: [0, 0] },
    { ...mesh, positions: [NaN, 0, 0] },
    { ...mesh, indices: [0, 1] },
    { ...mesh, indices: [0, 1, 3] },
    { ...mesh, indices: [0, 1, -1] },
    { ...mesh, indices: [0, 1, 0.5] },
  ])
    TestValidator.predicate(
      "invalid triangle buffers",
      throwsError(
        (): { triangle: number; minimum: number; }[]  => measureAutoMovieMeshClearance(invalid, mesh, "z"),
        "triangle buffers",
      ),
    );
  TestValidator.predicate(
    "invalid axis",
    throwsError(
      (): { triangle: number; minimum: number; }[]  => measureAutoMovieMeshClearance(mesh, mesh, "w" as never),
      "depth axis",
    ),
  );
  const huge: { positions: number[]; indices: number[]; normals: null; uvs: null; skin: null; } = { ...mesh, positions: [0, 0, 0, 1e308, 0, 0, 0, 1e308, 0] };
  TestValidator.predicate(
    "projected area overflow",
    throwsError(
      (): { triangle: number; minimum: number; }[]  => measureAutoMovieMeshClearance(huge, mesh, "z"),
      "projected area",
    ),
  );
  const high: { positions: number[]; indices: number[]; normals: null; uvs: null; skin: null; } = {
    ...mesh,
    positions: mesh.positions.map((v: number, i: number): number  => (i % 3 === 2 ? 1e308 : v)),
  };
  const low: { positions: number[]; indices: number[]; normals: null; uvs: null; skin: null; } = {
    ...mesh,
    positions: mesh.positions.map((v: number, i: number): number  => (i % 3 === 2 ? -1e308 : v)),
  };
  TestValidator.predicate(
    "depth difference overflow",
    throwsError(
      (): { triangle: number; minimum: number; }[]  => measureAutoMovieMeshClearance(high, low, "z"),
      "arithmetic",
    ),
  );
  const left: { positions: number[]; indices: number[]; normals: null; uvs: null; skin: null; } = {
    ...mesh,
    positions: [-1e308, 0, 0, 0, 0, 0, -1e308, 1e-308, 0],
  };
  const right: { positions: number[]; indices: number[]; normals: null; uvs: null; skin: null; } = {
    ...mesh,
    positions: [0, 0, 0, 1e308, 0, 0, 1e308, 1e-308, 0],
  };
  TestValidator.predicate(
    "cross triangle clipping overflow",
    throwsError(
      (): { triangle: number; minimum: number; }[]  => measureAutoMovieMeshClearance(left, right, "z"),
      "clipping",
    ),
  );
}
