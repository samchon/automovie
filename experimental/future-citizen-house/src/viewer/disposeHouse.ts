import * as THREE from "three";

/** @param {THREE.Object3D} root */

export function disposeHouse(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    if (object.customDepthMaterial) materials.add(object.customDepthMaterial);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) {
    if ("map" in material && material.map instanceof THREE.Texture) textures.add(material.map);
    material.dispose();
  }
  for (const texture of textures) texture.dispose();
}
