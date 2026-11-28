import { AutoMovieRenderFormationGeometry } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `instancedModelParts` lists the meshes of a model in traversal order.
 *
 * Scenarios:
 *
 * 1. A group of a mesh, a nested group holding a mesh, and a line lists the two
 *    meshes, parent before child.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenario describes a parent mesh, nested mesh, and line so the model part traversal is reproducible.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that instanced parts retain both meshes in traversal order and exclude the line.
 * @evidence contracts/development/testing.md#independent-expectations Compares the selected meshes with the two original fixture objects in the expected parent-first order.
 */
export function test_render_scene_instanced_model_parts(): void {
  const root: THREE.Group = new THREE.Group();
  const first: THREE.Mesh = new THREE.Mesh();
  const nested: THREE.Group = new THREE.Group();
  const second: THREE.Mesh = new THREE.Mesh();
  root.add(first, nested, new THREE.Line());
  nested.add(second);
  const parts: THREE.Mesh[] = AutoMovieRenderFormationGeometry.instancedModelParts(root);
  TestValidator.predicate(
    "meshes in order",
    parts.length === 2 && parts[0] === first && parts[1] === second,
  );
}