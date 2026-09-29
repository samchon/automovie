import {
  createHumanBodyBasisBuilder,
  createHumanBodySegmenter,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * Body render corners share only UV coordinates identical on the GPU.
 *
 * Scenarios:
 * 1. Two source UVs whose difference is lost by IEEE Float32 occupy one
 *    render vertex; a third UV still distinct after Float32 keeps a seam.
 * 2. The contact partition reads the same output corner order, retains every
 *    triangle, and a later build owns fresh UV and position arrays.
 * 3. A region without UVs stays untextured and preserves its eight vertices.
 */
export const test_human_body_gpu_uv_corners = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const region = basis.surfaces[0].regions[0];
  const occurrences = region.indices.flatMap((vertex, corner) =>
    vertex === 0 ? [corner] : [],
  );
  const uvs = region.indices.flatMap((vertex) => [0.25 + vertex / 32, 0.5]);
  uvs[occurrences[1] * 2] = 0.25 + 1e-10;
  uvs[occurrences[2] * 2] = 0.25 + 1e-7;
  region.uvs = uvs;
  const build = createHumanBodyBasisBuilder(basis);
  const first = build(document);
  const geometry = first.model.parts[0].geometry;
  if (geometry.type !== "mesh") throw new Error("Expected body skin mesh.");
  TestValidator.equals(
    "GPU-equivalent corners weld and a distinct Float32 seam remains",
    [geometry.mesh.positions.length / 3, geometry.mesh.uvs?.length],
    [9, 18],
  );
  TestValidator.predicate(
    "source UVs retain full precision while the output carries Float32 UVs",
    region.uvs[occurrences[1] * 2] === 0.25 + 1e-10 &&
      geometry.mesh.uvs?.every((value) => value === Math.fround(value)) === true,
  );
  const segmented = createHumanBodySegmenter(basis)(first);
  TestValidator.equals(
    "the contact partition retains the original twelve triangles",
    segmented.model.parts.reduce(
      (count, part) =>
        count +
        (part.geometry.type === "mesh"
          ? (part.geometry.mesh.indices?.length ?? 0) / 3
          : 0),
      0,
    ),
    12,
  );
  geometry.mesh.uvs![0] = 99;
  geometry.mesh.positions[0] = 99;
  const again = build(document).model.parts[0].geometry;
  if (again.type !== "mesh") throw new Error("Expected body skin mesh.");
  TestValidator.predicate(
    "the compiled correspondence returns independent document buffers",
    again.mesh.uvs?.[0] !== 99 && again.mesh.positions[0] !== 99,
  );
  const plain = humanBodyBasisFixture();
  const untextured = createHumanBodyBasisBuilder(plain.basis)(plain.document)
    .model.parts[0].geometry;
  if (untextured.type !== "mesh") throw new Error("Expected body skin mesh.");
  TestValidator.equals(
    "untextured body regions keep their source vertex count",
    [untextured.mesh.uvs, untextured.mesh.positions.length / 3],
    [null, 8],
  );
};
