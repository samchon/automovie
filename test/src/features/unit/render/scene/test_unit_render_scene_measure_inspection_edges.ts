import { measureAutoMovieInspectionEdges } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `measureAutoMovieInspectionEdges` marks each triangle side of a mesh once.
 *
 * Scenarios:
 *
 * 1. A unit cube has 12 edges and 6 face diagonals, 18 sides of 2 points each:
 *    one `edge` mark of 108 coordinates at the mesh's path.
 * 2. A mesh with no triangles has no mark.
 */
export function test_unit_render_scene_measure_inspection_edges(): void {
  const cube: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
  const measured = measureAutoMovieInspectionEdges({ mesh: cube, path: "box" });
  TestValidator.equals("one mark", measured.marks.length, 1);
  const mark = measured.marks[0]!;
  TestValidator.equals("kind and path", [mark.kind, mark.path], ["edge", "box/edge"]);
  TestValidator.equals(
    "coordinates",
    mark.shape.type === "segments" ? mark.shape.points.length : -1,
    18 * 2 * 3,
  );
  const empty = measureAutoMovieInspectionEdges({
    mesh: new THREE.Mesh(new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(0), 3),
    )),
    path: "",
  });
  TestValidator.equals("empty", empty.marks.length, 0);
}