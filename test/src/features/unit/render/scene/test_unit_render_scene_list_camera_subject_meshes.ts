import { listAutoMovieCameraSubjectMeshes } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `listAutoMovieCameraSubjectMeshes` lists the meshes a camera-edge measurement
 * can read exactly, or reports that it cannot.
 *
 * Scenarios:
 *
 * 1. Visible plain meshes are listed in traversal order, an invisible one and
 *    one on a layer the camera does not see are skipped.
 * 2. A line, a shader material, a displacement map and a morph target each make
 *    the subject unsupported.
 */
export function test_unit_render_scene_list_camera_subject_meshes(): void {
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  const mesh = (material: THREE.Material = new THREE.MeshBasicMaterial()): THREE.Mesh =>
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  const first: THREE.Mesh = mesh();
  const second: THREE.Mesh = mesh();
  const hidden: THREE.Mesh = mesh();
  hidden.visible = false;
  const elsewhere: THREE.Mesh = mesh();
  elsewhere.layers.set(3);
  const root: THREE.Group = new THREE.Group();
  root.add(first, hidden, elsewhere);
  const nested: THREE.Group = new THREE.Group();
  nested.add(second);
  root.add(nested);
  const listed: THREE.Mesh[] | undefined = listAutoMovieCameraSubjectMeshes(root, camera);
  TestValidator.predicate(
    "listed",
    listed !== undefined &&
      listed.length === 2 &&
      listed[0] === first &&
      listed[1] === second,
  );

  const unsupported = (object: THREE.Object3D): boolean => {
    const group: THREE.Group = new THREE.Group();
    group.add(object);
    return listAutoMovieCameraSubjectMeshes(group, camera) === undefined;
  };
  TestValidator.equals("line", unsupported(new THREE.Line()), true);
  TestValidator.equals("shader", unsupported(mesh(new THREE.ShaderMaterial())), true);
  const displaced: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  displaced.displacementMap = new THREE.Texture();
  TestValidator.equals("displacement", unsupported(mesh(displaced)), true);
  const morphed: THREE.Mesh = mesh();
  morphed.geometry.morphAttributes.position = [
    new THREE.BufferAttribute(new Float32Array(72), 3),
  ];
  TestValidator.equals("morph", unsupported(morphed), true);
}