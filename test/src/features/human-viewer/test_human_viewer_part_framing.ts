import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import { frameHumanViewerParts } from "../../../scripts/human-viewer/frameHumanViewerParts";
import { nclose } from "../internal/predicates";

/**
 * Part framing follows emitted transformed geometry, independently of neighbours.
 * Scenarios:
 * 1. A two-metre cube centred at (3,4,5) has radius sqrt(3), excluding a far neighbour.
 * 2. Selecting the assembly includes both meshes and empty selection means all meshes.
 * 3. Missing, empty and collapsed geometry refuse instead of producing an unreviewable frame.
 */
export function test_human_viewer_part_framing(): void {
  const root = new THREE.Group();
  const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  cube.name = "part"; cube.position.set(3, 4, 5);
  const far = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
  far.name = "neighbour"; far.position.set(13, 4, 5);
  root.add(cube, far);
  const part = frameHumanViewerParts(root, ["part"]);
  TestValidator.equals("centre", part.center, [3, 4, 5]);
  TestValidator.predicate("radius", nclose(part.radius, Math.sqrt(3)));
  const assembly = frameHumanViewerParts(root, ["part", "neighbour"]);
  TestValidator.equals("assembly centre", assembly.center, [8, 4, 5]);
  TestValidator.predicate("assembly radius", nclose(assembly.radius, Math.sqrt(38)));
  TestValidator.equals("all", frameHumanViewerParts(root, []), assembly);
  const point = new THREE.Mesh(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3)));
  point.name = "point";
  for (const [object, names] of [[root, ["part", "missing"]], [new THREE.Group(), []], [point, ["point"]]] as const) {
    let refused = false;
    try { frameHumanViewerParts(object, names); } catch { refused = true; }
    TestValidator.predicate("unframeable refuses", refused);
  }
  cube.geometry.dispose(); far.geometry.dispose(); point.geometry.dispose();
}
