import type { IAutoMovieMark, IAutoMovieMesh } from "@automovie/interface";
import * as THREE from "three";

/** Place one admitted metre mesh and its marks in the Human inspector frame. */
export function buildHumanSurfaceCapture(
  subject: string,
  part: string,
  mesh: Pick<IAutoMovieMesh, "positions" | "indices" | "normals">,
  marks: IAutoMovieMark[],
): { object: THREE.Group; marks: IAutoMovieMark[]; dispose: () => void } {
  const geometry: THREE.BufferGeometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(mesh.positions, 3),
  );
  geometry.setIndex(mesh.indices);
  if (mesh.normals === null) geometry.computeVertexNormals();
  else
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(mesh.normals, 3),
    );
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9b8a3,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const model: THREE.Mesh = new THREE.Mesh(geometry, material);
  model.name = part;
  const object: THREE.Group = new THREE.Group();
  object.name = subject;
  // Turn the +X anatomical front toward the inspector's +Z camera.
  object.rotation.y = -Math.PI / 2;
  object.add(model);
  object.updateMatrixWorld(true);
  return {
    object,
    marks,
    dispose: (): void => {
      geometry.dispose();
      material.dispose();
    },
  };
}
