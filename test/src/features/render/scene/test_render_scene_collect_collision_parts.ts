import { AutoMovieRenderInspectionGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspectionGeometry.collectCollisionParts` reads the visible drawn objects of a placed
 * layer as collision parts.
 *
 * Scenarios:
 *
 * 1. Two visible boxes named `left` and `right` are two parts in traversal
 *    order, and an invisible third is not read.
 * 2. A part allowance of one stops the collection and says so.
 */
export function test_render_scene_collect_collision_parts(): void {
  const box = (name: string, x: number): THREE.Mesh => {
    const mesh: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    mesh.name = name;
    mesh.position.x = x;
    return mesh;
  };
  const root: THREE.Scene = new THREE.Scene();
  const hidden: THREE.Mesh = box("hidden", 6);
  hidden.visible = false;
  root.add(box("left", 0), box("right", 3), hidden);
  root.updateMatrixWorld(true);

  const all = AutoMovieRenderInspectionGeometry.collectCollisionParts({ root }, { posedVertices: 1000 });
  TestValidator.equals(
    "parts",
    all.parts.map((part): string => part.id),
    ["left", "right"],
  );
  TestValidator.equals("complete", all.truncated, false);
  const limited = AutoMovieRenderInspectionGeometry.collectCollisionParts(
    { root },
    { posedVertices: 1000, parts: 1 },
  );
  TestValidator.equals("truncated", [limited.parts.length, limited.truncated], [1, true]);
}