import * as THREE from "three";

/** @param {THREE.Object3D} root */

export function disposeTree(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
    }
  });
}
