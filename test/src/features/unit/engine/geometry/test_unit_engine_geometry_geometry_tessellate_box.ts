import { tessellate } from "@automovie/engine";
import type { IAutoMovieTessellation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The box has an exact, known topology, so it is pinned precisely: six quad
 * faces, each with its own four vertices (so per-face normals stay crisp rather
 * than being averaged at shared corners), giving 24 vertices and 12 triangles.
 * The checks count populations and bound every finite vertex by the
 * half-extents.
 *
 * Scenarios:
 *
 * 1. A 0.4×0.6×0.2 box tessellates to 24 vertices and 36 indices, and no vertex
 *    lies outside ±(0.2, 0.3, 0.1), its half-extents.
 */
export function test_unit_engine_geometry_geometry_tessellate_box(): void {
  const box: IAutoMovieTessellation = tessellate({
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
      Math.abs(box.positions[i]!) > 0.2 + 1e-9 ||
      Math.abs(box.positions[i + 1]!) > 0.3 + 1e-9 ||
      Math.abs(box.positions[i + 2]!) > 0.1 + 1e-9
    )
      withinBounds = false;
  TestValidator.predicate("vertices within half-extents", withinBounds);
}
