import { type ITessellation, tessellate } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The box has an exact, known topology, so it is pinned precisely: six quad
 * faces, each with its own four vertices (so per-face normals stay crisp rather
 * than being averaged at shared corners), giving 24 vertices and 12 triangles.
 * The checks count populations and bound every finite vertex by the half-extents.
 *
 * Scenarios:
 * 1. A 0.4×0.6×0.2 box tessellates to 24 vertices and 36 indices, and no
 * vertex lies outside ±(0.2, 0.3, 0.1), its half-extents.
 *
 * @evidence contracts/testing.md#behavioral-verification Tessellates the existing box, requiring 24 vertices, 36 indices and finite position components within the authored half-extents plus the retained slack. It catches wrong populations, overflow or oversized geometry while allowing ordinary binary64 roundoff.
 * @evidence contracts/testing.md#independent-expectations Six independent four-corner faces give 24 vertices and two triangles per face give 36 indices; halving the authored dimensions gives 0.2/0.3/0.1 metre bounds with 1e-9 slack. These count/bound checks do not establish every face corner, normal, winding or rendered silhouette.
 * @evidence contracts/testing.md#distinguishing-cases Keeps the one asymmetric positive-dimension box so all three axis extents differ. Other primitive entries own common buffer invariants, outward winding and unsupported shape discriminators; no malformed dimension or zero-size behavior is claimed here.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly calls portable tessellation source and observes numeric buffers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; it owns its single case without dynamic registration.
 */
export function test_geometry_tessellate_box(): void {
  const box: ITessellation = tessellate({
    type: "box",
    width: 0.4,
    height: 0.6,
    depth: 0.2,
  });
  TestValidator.equals("24 vertices", box.positions.length / 3, 24);
  TestValidator.equals("36 indices", box.indices.length, 36);

  let withinBounds: boolean = true;
  for (let i: number = 0; i < box.positions.length; i += 3)
    if (
      !Number.isFinite(box.positions[i]) ||
      !Number.isFinite(box.positions[i + 1]) ||
      !Number.isFinite(box.positions[i + 2]) ||
      Math.abs(box.positions[i]!) > 0.2 + 1e-9 ||
      Math.abs(box.positions[i + 1]!) > 0.3 + 1e-9 ||
      Math.abs(box.positions[i + 2]!) > 0.1 + 1e-9
    )
      withinBounds = false;
  TestValidator.predicate("vertices within half-extents", withinBounds);
}
