import { AutoMovieRenderInspectionMaterial } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderInspectionMaterial.colorObjects` swaps the material of each mesh whose path
 * a colour pattern matches, and returns the call that puts the materials back.
 *
 * Scenarios:
 *
 * 1. Under the beauty shade a matching mesh gets an unlit double-sided material
 *    of the colour, the last matching pattern winning; others are untouched.
 * 2. Under the clay shade the material is a lit one.
 * 3. Restoring brings the first material back and disposes the one made.
 * 4. A colour under another shade is refused.
 */
export function test_render_scene_color_inspection_objects(): void {
  const original: THREE.Material = new THREE.MeshStandardMaterial();
  const other: THREE.Material = new THREE.MeshStandardMaterial();
  const hero: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    new THREE.BoxGeometry(),
    original,
  );
  const lamp: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
    new THREE.BoxGeometry(),
    other,
  );
  const meshes = [
    { path: "hero", mesh: hero },
    { path: "lamp", mesh: lamp },
  ];
  const restore: () => void = AutoMovieRenderInspectionMaterial.colorObjects({
    meshes,
    shade: "beauty",
    color: [
      { pattern: "hero", color: 0x112233 },
      { pattern: "hero", color: 0xff8800 },
    ],
  });
  const painted: THREE.Material = hero.material;
  TestValidator.predicate("lamp untouched", lamp.material === other);
  TestValidator.predicate(
    "hero painted",
    painted !== original &&
      painted.side === THREE.DoubleSide &&
      painted.isMeshBasicMaterial === true,
  );
  let disposed: number = 0;
  painted.addEventListener("dispose", (): void => {
    ++disposed;
  });
  restore();
  TestValidator.predicate("restored", hero.material === original);
  TestValidator.equals("disposed", disposed, 1);

  const clay: () => void = AutoMovieRenderInspectionMaterial.colorObjects({
    meshes,
    shade: "clay",
    color: [{ pattern: "lamp", color: 0x00ff00 }],
  });
  TestValidator.equals(
    "lit",
    lamp.material.isMeshLambertMaterial,
    true,
  );
  clay();
  TestValidator.error("other shade", (): void => {
    AutoMovieRenderInspectionMaterial.colorObjects({
      meshes,
      shade: "depth",
      color: [{ pattern: "hero", color: 0xff0000 }],
    });
  });
  TestValidator.predicate("nothing left swapped", hero.material === original);
}